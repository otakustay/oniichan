import {Roundtrip} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {EditorHost} from '../editor';
import {WorkflowRunner, WorkflowRunnerInit} from './workflow';
import {ToolCallWorkflowRunner, ToolCallWorkflowRunnerInit} from './tool';

export interface DetectWorkflowOptions {
    threadUuid: string;
    taskId: string;
    roundtrip: Roundtrip;
    editorHost: EditorHost;
    telemetry: FunctionUsageTelemetry;
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
        telemetry: options.telemetry,
        onUpdateThrad: options.onUpdateThread,
    };
    const workflow = options.roundtrip.startWorkflowResponse(toolCallMessage);
    const init: ToolCallWorkflowRunnerInit = {
        ...baseInit,
        workflow,
        editorHost: options.editorHost,
        origin: toolCallMessage,
    };
    return new ToolCallWorkflowRunner(init);
}
