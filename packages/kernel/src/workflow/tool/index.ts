import {ToolCallInput} from '@oniichan/shared/tool';
import {EditorHost} from '../../editor';
import {WorkflowRunner, WorkflowRunnerInit} from '../workflow';
import {ToolImplement} from './implement';
import {ToolUseMessage} from '@oniichan/shared/inbox';
import {newUuid} from '@oniichan/shared/id';

export interface ToolCallWorkflowRunnerInit extends WorkflowRunnerInit {
    input: ToolCallInput;
    editorHost: EditorHost;
}

export class ToolCallWorkflowRunner extends WorkflowRunner {
    private readonly implment: ToolImplement;

    private readonly input: ToolCallInput;

    constructor(init: ToolCallWorkflowRunnerInit) {
        super(init);
        this.input = init.input;
        this.implment = new ToolImplement(init.editorHost);
    }

    async execute() {
        const result = await this.implment.callTool(this.input);
        const responseMessage = new ToolUseMessage(newUuid(), result);
        this.workflow.addReaction(responseMessage, true);
        this.updateThread();
    }
}
