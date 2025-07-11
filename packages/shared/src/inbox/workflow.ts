import type {MessageData, ToolCallMessageData} from './message.js';

export type WorkflowStatus = 'running' | 'completed' | 'failed';

export type WorkflowOriginMessageData = ToolCallMessageData;

export interface WorkflowData {
    status: WorkflowStatus;
    origin: WorkflowOriginMessageData;
    reactions: MessageData[];
    exposed: string[];
}
