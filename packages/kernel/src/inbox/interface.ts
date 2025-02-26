import {FileEditData} from '@oniichan/shared/patch';
import {RoundtripData, RoundtripStatus} from '@oniichan/shared/inbox';
import {AssistantTextMessage, UserRequestMessage, Message} from './message';
import {Workflow, WorkflowOriginMessage} from './workflow';

// TODO: Change to `InboxRoundtrip` and abstract every other data class as interface
export interface InboxRoundtrip {
    setRequest(request: UserRequestMessage): void;
    getRequestText(): string;
    getStatus(): RoundtripStatus;
    markStatus(status: RoundtripStatus): void;
    startTextResponse(messageUuid: string): AssistantTextMessage;
    startWorkflowResponse(origin: WorkflowOriginMessage): Workflow;
    hasMessage(messageUuid: string): boolean;
    findMessageByUuid(messageUuid: string): Message | null;
    getLatestTextMessageStrict(): AssistantTextMessage;
    addWarning(message: string): void;
    toMessages(): Message[];
    toRoundtripData(): RoundtripData;
    getEditStackForFile(file: string): FileEditData[];
}
