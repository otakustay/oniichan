import type {ChatInputPayload} from '@oniichan/shared/model';
import type {
    RoundtripData,
    RoundtripStatus,
    RoundtripMessageData,
    MessageType,
    WorkflowSourceChunkStatus,
    WorkflowChunkStatus,
    WorkflowOriginMessageData,
    MessageData,
    AssistantTextMessageData,
    ToolCallMessageData,
    WorkflowStatus,
    WorkflowData,
    UserRequestMessageData,
    ParsedToolCallMessageChunk,
    MessageInputChunk,
    ToolCallMessageChunk,
    ToolUseMessageData,
    MessageThreadData,
    MessageThreadPersistData,
    TaggedMessageChunk,
    PlanMessageData,
    PlanMessageChunk,
    PlanTask,
    PlanCompletionProgress,
} from '@oniichan/shared/inbox';
import type {ContentTagName} from '@oniichan/shared/tool';

export interface InboxRoundtrip {
    setRequest(request: InboxUserRequestMessage): void;
    getRequestText(): string;
    getStatus(): RoundtripStatus;
    markStatus(status: RoundtripStatus): void;
    startTextResponse(messageUuid: string): InboxAssistantTextMessage;
    startWorkflowResponse(origin: InboxOriginMessageBase): InboxWorkflow;
    hasMessage(messageUuid: string): boolean;
    findMessageByUuid(messageUuid: string): InboxMessage | null;
    getLatestTextMessage(): InboxAssistantTextMessage | null;
    getLatestWorkflow(): InboxWorkflow | null;
    getLatestTextMessageStrict(): InboxAssistantTextMessage;
    getLatestWorkflowStrict(): InboxWorkflow;
    addWarning(message: string): void;
    toMessages(): InboxMessage[];
    toRoundtripData(): RoundtripData;
    toRoundtripMessageData(): RoundtripMessageData;
}

export interface InboxMessageBase<T extends MessageType = MessageType> {
    readonly uuid: string;
    readonly type: T;
    getRoundtrip(): InboxRoundtrip;
    setError(reason: string): void;
    toMessageData(): MessageData;
    toChatInputPayload(): ChatInputPayload;
}

export interface InboxUserRequestMessage extends InboxMessageBase<'userRequest'> {
    toMessageData(): UserRequestMessageData;
}

interface InboxWorkflowSourceMessageBase extends InboxMessageBase<'assistantText'> {
    getWorkflowSourceStatus(): WorkflowSourceChunkStatus;
    markWorkflowSourceStatus(status: WorkflowSourceChunkStatus): void;
}

export interface InboxAssistantTextMessage extends InboxWorkflowSourceMessageBase {
    toMessageData(): AssistantTextMessageData;
    getTextContent(): string;
    addChunk(chunk: MessageInputChunk): void;
    findPlanChunk(): PlanMessageChunk | null;
    findPlanChunkStrict(): PlanMessageChunk;
    findTaggedChunk(tagName: ContentTagName): TaggedMessageChunk | null;
    findTaggedChunkStrict(tagName: ContentTagName): TaggedMessageChunk;
    findToolCallChunk(): ToolCallMessageChunk | null;
    findToolCallChunkStrict(): ToolCallMessageChunk;
    replaceToolCallChunk(newChunk: ToolCallMessageChunk): void;
}

type OriginType = 'toolCall' | 'plan';

interface InboxOriginMessageBase<T extends OriginType = OriginType> extends InboxMessageBase<T> {
    getWorkflowOriginStatus(): WorkflowChunkStatus;
    markWorkflowOriginStatus(status: WorkflowChunkStatus): void;
    toMessageData(): WorkflowOriginMessageData;
}

export type PlanState = 'plan' | 'conclusion';

export interface InboxPlanMessage extends InboxOriginMessageBase<'plan'> {
    toMessageData(): PlanMessageData;
    pickFirstPendingTask(): PlanTask | null;
    getExecutingTask(): PlanTask | null;
    completeExecutingTask(): void;
    getProgress(): PlanCompletionProgress;
    getPlanState(): PlanState;
}

export interface InboxToolCallMessage extends InboxOriginMessageBase<'toolCall'> {
    toMessageData(): ToolCallMessageData;
    findToolCallChunkStrict(): ParsedToolCallMessageChunk;
}

export interface InboxToolUseMessage extends InboxMessageBase<'toolUse'> {
    toMessageData(): ToolUseMessageData;
}

export type InboxAssistantMessage = InboxAssistantTextMessage | InboxToolCallMessage | InboxPlanMessage;

export type InboxWorkflowSourceMessage = InboxAssistantTextMessage;

export type InboxWorkflowOriginMessage = InboxPlanMessage | InboxToolCallMessage;

export type InboxMessage =
    | InboxUserRequestMessage
    | InboxAssistantTextMessage
    | InboxToolCallMessage
    | InboxPlanMessage
    | InboxToolUseMessage;

export interface InboxWorkflow {
    getStatus(): WorkflowStatus;
    getOriginMessage(): InboxWorkflowOriginMessage;
    shouldContinueRoundtrip(): boolean;
    setContinueRoundtrip(shouldContinue: boolean): void;
    markStatus(status: WorkflowStatus): void;
    startReaction(uuid: string): InboxAssistantTextMessage;
    exposeMessage(messageUuid: string): void;
    addTextReaction(text: string, exposed: boolean): void;
    addReaction(message: InboxMessage, exposed: boolean): void;
    isOriginatedBy(uuid: string): boolean;
    hasMessage(messageUuid: string): boolean;
    findMessage(messageUuid: string): InboxMessage | null;
    toMessages(): InboxMessage[];
    toWorkflowData(): WorkflowData;
}

export interface InboxMessageThread {
    readonly uuid: string;
    addRoundtrip(roundtrip: InboxRoundtrip): void;
    hasMessage(messageUuid: string): boolean;
    findMessageByUuidStrict(messageUuid: string): InboxMessage; // Assuming InboxMessage is the return type
    findRoundtripByMessageUuidStrict(messageUuid: string): InboxRoundtrip;
    sliceRoundtripAfter(messageUuid: string): InboxRoundtrip[];
    rollbackRoundtripTo(messageUuid: string): void;
    toMessages(): InboxMessage[]; // Assuming InboxMessage is the return type
    toThreadData(): MessageThreadData;
    toPersistData(): MessageThreadPersistData;
}
