import {MessageData, ToolCallMessageData} from './message';

export type WorkflowStatus = 'running' | 'completed' | 'failed';

export type WorkflowOriginMessageData = ToolCallMessageData;

export interface WorkflowData {
    status: WorkflowStatus;
    origin: WorkflowOriginMessageData;
    reactions: MessageData[];
    exposed: string[];
}
