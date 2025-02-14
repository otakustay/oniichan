import {AssistantTextMessageData, UserRequestMessageData, DebugMessageData} from './message';
import {WorkflowData} from './workflow';

interface RoundtripMessageResponseData {
    type: 'message';
    message: AssistantTextMessageData;
}

interface RoundtripWorkflowResponseData {
    type: 'workflow';
    workflow: WorkflowData;
}

interface RoundtripDebugResponseData {
    type: 'debug';
    message: DebugMessageData;
}

export type RoundtripResponseData =
    | RoundtripMessageResponseData
    | RoundtripWorkflowResponseData
    | RoundtripDebugResponseData;

export type RoundtripStatus = 'running' | 'unread' | 'read';

export interface RoundtripData {
    status: RoundtripStatus;
    request: UserRequestMessageData;
    responses: RoundtripResponseData[];
}
