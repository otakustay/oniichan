import {EditorHost} from '../editor';
import {WorkflowRunner, WorkflowRunnerInit} from './workflow';
import {ToolCallWorkflowRunner, ToolCallWorkflowRunnerInit} from './tool';
import {Roundtrip} from '@oniichan/shared/inbox';

export interface DetectWorkflowOptions {
    threadUuid: string;
    taskId: string;
    roundtrip: Roundtrip;
    editorHost: EditorHost;
    onUpdateThread: () => void;
}

export function detectWorkflow(options: DetectWorkflowOptions): WorkflowRunner | null {
    const messages = options.roundtrip.toMessages();
    const assistantTextMessage = options.roundtrip.getLatestTextMessageStrict();
    const toolCallMessage = assistantTextMessage.toToolCallMessage();

    if (!toolCallMessage) {
        return null;
    }

    const baseInit: Omit<WorkflowRunnerInit, 'workflow'> = {
        threadUuid: options.threadUuid,
        taskId: options.taskId,
        base: messages.filter(v => v !== assistantTextMessage),
        origin: toolCallMessage,
        onUpdateThrad: options.onUpdateThread,
    };
    const workflow = options.roundtrip.startWorkflowResponse(toolCallMessage);
    const init: ToolCallWorkflowRunnerInit = {
        ...baseInit,
        workflow,
        editorHost: options.editorHost,
        input: toolCallMessage.getToolCallInput(),
    };
    return new ToolCallWorkflowRunner(init);
}
