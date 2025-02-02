import {newUuid} from '@oniichan/shared/id';
import {ToolCallMessage, ToolUseMessage} from '@oniichan/shared/inbox';
import {EditorHost, ModelAccessHost} from '../../editor';
import {WorkflowRunner, WorkflowRunnerInit, WorkflowRunResult} from '../workflow';
import {ToolImplement} from './implement';
import {fixToolCall, ToolCallFixOptions} from './fix';

const RETRY_LIMIT = 3;

export interface ToolCallWorkflowRunnerInit extends WorkflowRunnerInit {
    origin: ToolCallMessage;
    editorHost: EditorHost;
}

export class ToolCallWorkflowRunner extends WorkflowRunner {
    private readonly implment: ToolImplement;

    private readonly model: ModelAccessHost;

    private readonly message: ToolCallMessage;

    private retries = 0;

    constructor(init: ToolCallWorkflowRunnerInit) {
        super(init);
        this.message = init.origin;
        this.model = init.editorHost.getModelAccess(init.taskId);
        this.implment = new ToolImplement(init.editorHost);
    }

    async execute(): Promise<WorkflowRunResult> {
        if (this.retries >= RETRY_LIMIT) {
            this.origin.setError('Model generates an invalid tool call and oniichan is unable to fix it');
            return {finished: true};
        }

        const result = await this.implment.callTool(this.message.getToolCallInput());

        if (result.type === 'success' || result.type === 'executeError') {
            const responseMessage = new ToolUseMessage(newUuid(), result.output);
            this.workflow.addReaction(responseMessage, true);
            this.updateThread();
            return {finished: result.type === 'success' && result.finished};
        }

        const fixOptions: ToolCallFixOptions = {
            input: this.message.getToolCallInput(),
            response: this.message.getTextContent(),
            error: result,
            model: this.model,
            telemetry: this.telemetry,
        };
        const newToolCall = await fixToolCall(fixOptions);
        this.origin.replaceToolCallInput(newToolCall);
        this.updateThread();

        this.retries++;
        return this.execute();
    }
}
