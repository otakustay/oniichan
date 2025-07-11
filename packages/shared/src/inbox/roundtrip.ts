import type {AssistantTextMessageData, UserRequestMessageData} from './message.js';
import type {WorkflowData} from './workflow.js';

interface RoundtripMessageResponseData {
    type: 'message';
    message: AssistantTextMessageData;
}

interface RoundtripWorkflowResponseData {
    type: 'workflow';
    workflow: WorkflowData;
}

export type RoundtripResponseData = RoundtripMessageResponseData | RoundtripWorkflowResponseData;

export type RoundtripStatus = 'running' | 'unread' | 'read';

export interface RoundtripData {
    status: RoundtripStatus;
    request: UserRequestMessageData;
    responses: RoundtripResponseData[];
}
