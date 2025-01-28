import {ModelToolCallInput} from '@oniichan/shared/tool';
import {EditorHost} from '../../editor';
import {WorkflowRunner, WorkflowRunnerInit, WorkflowRunResult} from '../workflow';
import {ToolImplement} from './implement';
import {ToolUseMessage} from '@oniichan/shared/inbox';
import {newUuid} from '@oniichan/shared/id';

export interface ToolCallWorkflowRunnerInit extends WorkflowRunnerInit {
    input: ModelToolCallInput;
    editorHost: EditorHost;
}

export class ToolCallWorkflowRunner extends WorkflowRunner {
    private readonly implment: ToolImplement;

    private readonly input: ModelToolCallInput;

    constructor(init: ToolCallWorkflowRunnerInit) {
        super(init);
        this.input = init.input;
        // TODO: Failures like validation error should be handled with a workflow
        this.implment = new ToolImplement(init.editorHost);
    }

    async execute(): Promise<WorkflowRunResult> {
        const result = await this.implment.callTool(this.input);
        const responseMessage = new ToolUseMessage(newUuid(), result);
        this.workflow.addReaction(responseMessage, true);
        this.updateThread();
        return {autoContinue: !!result};
    }
}
