import type {MessageData, PlanMessageData, ToolCallMessageData} from './message';

export type WorkflowStatus = 'running' | 'completed' | 'failed';

export type WorkflowOriginMessageData = ToolCallMessageData | PlanMessageData;

export interface WorkflowData {
    status: WorkflowStatus;
    origin: WorkflowOriginMessageData;
    reactions: MessageData[];
    exposed: string[];
}
