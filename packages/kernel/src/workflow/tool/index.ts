import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {ToolCallMessage, ToolUseMessage} from '../../inbox';
import {EditorHost} from '../../core/editor';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {WorkflowRunner, WorkflowRunnerInit, WorkflowRunResult} from '../workflow';
import {ToolImplement} from './implement';
import {ToolCallFixer, ToolCallFixerInit, ToolCallMessageParser} from './fix';
import {ExecuteError, RequireFix, Success, ToolInputError} from './utils';
import {assertNever} from '@oniichan/shared/error';

const RETRY_LIMIT = 3;

export interface ToolCallWorkflowRunnerInit extends WorkflowRunnerInit {
    systemPrompt: string;
    origin: ToolCallMessage;
    editorHost: EditorHost;
    modelAccess: ModelAccessHost;
}

export class ToolCallWorkflowRunner extends WorkflowRunner {
    private readonly implment: ToolImplement;

    private readonly modelAccess: ModelAccessHost;

    private readonly systemPrompt: string;

    private readonly message: ToolCallMessage;

    private readonly editorHost: EditorHost;

    private readonly logger: Logger;

    private retries = 0;

    constructor(init: ToolCallWorkflowRunnerInit) {
        super(init);
        this.message = init.origin;
        this.systemPrompt = init.systemPrompt;
        this.editorHost = init.editorHost;
        this.modelAccess = init.modelAccess;
        this.implment = new ToolImplement(init);
        this.logger = init.logger.with({source: 'ToolCallWorkflowRunner'});
    }

    protected async executeRun(): Promise<WorkflowRunResult> {
        const toolInput = this.message.getToolCallInput();
        this.logger.trace('ToolCallStart', {input: toolInput, retry: this.retries});
        for await (const step of this.implment.callTool(toolInput)) {
            switch (step.type) {
                case 'startToolRun':
                    this.origin.markToolCallStatus('executing');
                    break;
                case 'requireApprove':
                    this.origin.markToolCallStatus('waitingApprove');
                    return {finished: true};
                case 'executeError':
                case 'success':
                    return this.handleExecuteFinishStep(step);
                case 'requireFix':
                    return this.handleRequireFixStep(step);
                case 'parameterMissing':
                case 'parameterType':
                case 'validationError':
                    return this.handleInputErrorStep(step);
                default:
                    assertNever<{type: string}>(step, v => `Unknown step type ${v.type}`);
            }
        }
        throw new Error('Tool execute yields no expected result');
    }

    protected async executeReject(): Promise<WorkflowRunResult> {
        const toolInput = this.message.getToolCallInput();
        this.logger.trace('ToolRejectStart', {input: toolInput, retry: this.retries});
        const result = await this.implment.rejectTool(toolInput);
        if (result.type === 'executeError' || result.type === 'success') {
            return this.handleRejectFinishStep(result);
        }
        throw new Error('Tool reject yields no expected result');
    }

    private async handleInputErrorStep(step: ToolInputError) {
        this.logger.trace('FixToolError', {error: step});
        const fixerInit: ToolCallFixerInit = {
            message: this.message,
            error: step,
            editorHost: this.editorHost,
            modelAccess: this.modelAccess,
            telemetry: this.telemetry,
        };
        const fixer = new ToolCallFixer(fixerInit);
        const newToolCall = await fixer.fixToolCall();
        await this.origin.replaceToolCallInput(newToolCall, this.editorHost);
        this.updateThread();
        return this.retry();
    }

    private async handleRequireFixStep(step: RequireFix) {
        this.logger.trace('FixToolCallStart', {result: step.type});
        await this.fix(step);
        this.logger.trace('FixToolCallFinish', {result: step.type});
        this.updateThread();
        return this.retry();
    }

    private handleExecuteFinishStep(step: Success | ExecuteError) {
        this.origin.markToolCallStatus(step.type === 'success' ? 'completed' : 'failed');
        this.logger.trace('ToolCallFinish', {result: step.type});
        return this.finishAndContinue(step);
    }

    private handleRejectFinishStep(step: Success | ExecuteError) {
        this.logger.trace('ToolRejectFinish', {result: step.type});
        return this.finishAndContinue(step);
    }

    private finishAndContinue(step: Success | ExecuteError) {
        const responseMessage = new ToolUseMessage(newUuid(), this.message.getRoundtrip(), step.output);
        this.workflow.markStatus('completed');
        this.workflow.addReaction(responseMessage, true);
        this.updateThread();
        return {finished: step.type === 'executeError' || step.finished};
    }

    private async retry() {
        this.retries++;

        if (this.retries >= RETRY_LIMIT) {
            this.logger.error('TooManyRetry', {retry: this.retries});
            this.origin.setError('Model generates an invalid tool call and oniichan is unable to fix it');
            return {finished: true};
        }

        return this.executeRun();
    }

    private async fix(input: RequireFix) {
        const messages = [
            ...(input.includesBase ? this.base : []),
            this.origin,
            new ToolUseMessage(newUuid(), this.message.getRoundtrip(), input.prompt),
        ];
        const options: ModelChatOptions = {
            messages: messages.map(v => v.toChatInputPayload()).filter(v => !!v),
            telemetry: this.telemetry.createModelTelemetry(),
            systemPrompt: this.systemPrompt,
        };
        const response = await this.modelAccess.chat(options);
        const parser = new ToolCallMessageParser({message: this.message, editorHost: this.editorHost});
        const toolCall = await parser.parseToolMessage(response.content);
        await this.origin.replaceToolCallInput(toolCall, this.editorHost);
    }
}
