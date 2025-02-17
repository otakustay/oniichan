import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {ToolCallMessage, ToolUseMessage} from '../../inbox';
import {EditorHost, ModelAccessHost, ModelChatOptions} from '../../editor';
import {WorkflowRunner, WorkflowRunnerInit, WorkflowRunResult} from '../workflow';
import {ToolImplement} from './implement';
import {ToolCallFixer, ToolCallFixerInit, ToolCallMessageParser} from './fix';
import {isToolInputError, RequireFix} from './utils';

const RETRY_LIMIT = 3;

export interface ToolCallWorkflowRunnerInit extends WorkflowRunnerInit {
    systemPrompt: string;
    origin: ToolCallMessage;
    editorHost: EditorHost;
}

export class ToolCallWorkflowRunner extends WorkflowRunner {
    private readonly implment: ToolImplement;

    private readonly model: ModelAccessHost;

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
        this.model = init.editorHost.getModelAccess(init.taskId);
        this.implment = new ToolImplement(init);
        this.logger = init.logger.with({source: 'ToolCallWorkflowRunner'});
    }

    async execute(): Promise<WorkflowRunResult> {
        const toolInput = this.message.getToolCallInput();
        this.logger.trace('ToolCallStart', {input: toolInput, retry: this.retries});
        const result = await this.implment.callTool(toolInput);

        if (result.type === 'requireFix') {
            this.logger.trace('FixToolCallStart', {result: result.type});
            await this.fix(result);
            this.logger.trace('FixToolCallFinish', {result: result.type});
            this.updateThread();
            return this.retry();
        }

        if (isToolInputError(result)) {
            this.logger.trace('FixToolError', {error: result});
            const fixerInit: ToolCallFixerInit = {
                message: this.message,
                error: result,
                editorHost: this.editorHost,
                model: this.model,
                telemetry: this.telemetry,
            };
            const fixer = new ToolCallFixer(fixerInit);
            const newToolCall = await fixer.fixToolCall();
            await this.origin.replaceToolCallInput(newToolCall, this.editorHost);
            this.updateThread();
            return this.retry();
        }

        this.origin.completeToolCall();
        this.logger.trace('ToolCallFinish', {result: result.type});

        const responseMessage = new ToolUseMessage(newUuid(), this.message.getRoundtrip(), result.output);
        this.workflow.addReaction(responseMessage, true);
        this.updateThread();
        return {finished: result.type === 'success' && result.finished};
    }

    private async retry() {
        this.retries++;

        if (this.retries >= RETRY_LIMIT) {
            this.logger.error('TooManyRetry', {retry: this.retries});
            this.origin.setError('Model generates an invalid tool call and oniichan is unable to fix it');
            return {finished: true};
        }

        return this.execute();
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
        const response = await this.model.chat(options);
        const parser = new ToolCallMessageParser({message: this.message, editorHost: this.editorHost});
        const toolCall = await parser.parseToolMessage(response.content);
        await this.origin.replaceToolCallInput(toolCall, this.editorHost);
    }
}
