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
    MessageInputChunk,
    ToolCallMessageChunk,
    ToolUseMessageData,
    MessageThreadData,
    MessageThreadPersistData,
    MessageThreadWorkingMode,
    ParsedToolCallMessageChunkOf,
    AssistantRole,
} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';

export interface InboxRoundtrip {
    setRequest(request: InboxUserRequestMessage): void;
    getRequestText(): string;
    getStatus(): RoundtripStatus;
    markStatus(status: RoundtripStatus): void;
    startTextResponse(messageUuid: string, role: AssistantRole): InboxAssistantTextMessage;
    startWorkflowResponse(origin: InboxOriginMessageBase): InboxWorkflow;
    hasMessage(messageUuid: string): boolean;
    findMessageByUuid(messageUuid: string): InboxMessage | null;
    getLatestTextMessage(): InboxAssistantTextMessage | null;
    getLatestTextMessageStrict(): InboxAssistantTextMessage;
    getLatestWorkflow(): InboxWorkflow | null;
    getLatestWorkflowStrict(): InboxWorkflow;
    findLastToolCallMessageByToolNameStrict<N extends ToolName>(toolName: N): InboxToolCallMessage<N>;
    findLastToolCallChunkByToolNameStrict<N extends ToolName>(toolName: N): ParsedToolCallMessageChunkOf<N>;
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

export interface UserRequestMessageToChatInpytPayloadOptions {
    hideUserRequest: boolean;
}

export interface InboxUserRequestMessage extends InboxMessageBase<'userRequest'> {
    toMessageData(): UserRequestMessageData;
    toChatInputPayload(options?: UserRequestMessageToChatInpytPayloadOptions): ChatInputPayload;
}

interface InboxWorkflowSourceMessageBase extends InboxMessageBase<'assistantText'> {
    getWorkflowSourceStatus(): WorkflowSourceChunkStatus;
    markWorkflowSourceStatus(status: WorkflowSourceChunkStatus): void;
}

export interface InboxAssistantTextMessage extends InboxWorkflowSourceMessageBase {
    toMessageData(): AssistantTextMessageData;
    getTextContent(): string;
    addChunk(chunk: MessageInputChunk): void;
    findToolCallChunk(): ToolCallMessageChunk | null;
    findToolCallChunkStrict(): ToolCallMessageChunk;
    replaceToolCallChunk(newChunk: ToolCallMessageChunk): void;
}

type OriginType = 'toolCall';

interface InboxOriginMessageBase<T extends OriginType = OriginType> extends InboxMessageBase<T> {
    getWorkflowOriginStatus(): WorkflowChunkStatus;
    markWorkflowOriginStatus(status: WorkflowChunkStatus): void;
    toMessageData(): WorkflowOriginMessageData;
}

export interface ToolCallMessageToChatInpytPayloadOptions {
    hidePlanDetail: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
export interface InboxToolCallMessage<N extends ToolName = ToolName> extends InboxOriginMessageBase<'toolCall'> {
    toMessageData(): ToolCallMessageData;
    findToolCallChunkStrict(): ParsedToolCallMessageChunkOf<N>;
    toChatInputPayload(options?: ToolCallMessageToChatInpytPayloadOptions): ChatInputPayload;
}

export interface InboxToolUseMessage extends InboxMessageBase<'toolUse'> {
    toMessageData(): ToolUseMessageData;
}

export type InboxAssistantMessage = InboxAssistantTextMessage | InboxToolCallMessage;

export type InboxWorkflowSourceMessage = InboxAssistantTextMessage;

export type InboxWorkflowOriginMessage = InboxToolCallMessage;

export type InboxMessage =
    | InboxUserRequestMessage
    | InboxAssistantTextMessage
    | InboxToolCallMessage
    | InboxToolUseMessage;

export interface InboxWorkflow {
    getStatus(): WorkflowStatus;
    getOriginMessage(): InboxWorkflowOriginMessage;
    shouldContinueRoundtrip(): boolean;
    setContinueRoundtrip(shouldContinue: boolean): void;
    markStatus(status: WorkflowStatus): void;
    exposeMessage(messageUuid: string): void;
    addTextReaction(text: string, exposed: boolean): void;
    addReaction(message: InboxMessage, exposed: boolean): void;
    hasMessage(messageUuid: string): boolean;
    findMessage(messageUuid: string): InboxMessage | null;
    toMessages(): InboxMessage[];
    toWorkflowData(): WorkflowData;
}

export interface InboxMessageThread {
    readonly uuid: string;
    getWorkingMode(): MessageThreadWorkingMode;
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
