import {assertNever} from '../error';
import {ChatInputPayload} from '../model';
import {now} from '../string';
import {ToolCallInput, ToolName, ToolParsedChunk} from '../tool';

export type MessageStatus = 'generating' | 'unread' | 'read';

export interface ToolCallMessageChunk {
    toolName: ToolName;
    arguments: Record<string, string>;
    status: 'generating' | 'completed';
}

interface MessageDataBase {
    uuid: string;
    createdAt: string;
    status: MessageStatus;
    error?: string | undefined;
}

export interface MessagePersistDataBase extends MessageDataBase {
    textContent: string;
}

export interface UserRequestMessageData extends MessageDataBase {
    type: 'userRequest';
    content: string;
}

export interface UserRequestMessagePersistData extends MessagePersistDataBase {
    type: 'userRequest';
}

export interface AssistantTextMessageData extends MessageDataBase {
    type: 'assistantText';
    chunks: Array<string | ToolCallMessageChunk>;
}

export interface AssistantTextMessagePersistData extends MessagePersistDataBase {
    type: 'assistantText';
    chunks: Array<string | ToolCallMessageChunk>;
}

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    chunks: Array<string | ToolCallMessageChunk>;
}

export interface ToolCallMessagePersistData extends MessagePersistDataBase {
    type: 'toolCall';
    chunks: Array<string | ToolCallMessageChunk>;
}

export interface ToolUseMessageData extends MessageDataBase {
    type: 'toolUse';
    content: string;
}

export interface ToolUseMessagePersistData extends MessagePersistDataBase {
    type: 'toolUse';
}

export type MessageData = UserRequestMessageData | AssistantTextMessageData | ToolCallMessageData | ToolUseMessageData;

export type MessagePersistData =
    | UserRequestMessagePersistData
    | AssistantTextMessagePersistData
    | ToolCallMessagePersistData
    | ToolUseMessagePersistData;

export type MessageType = MessageData['type'];

abstract class MessageBase<T extends MessageType> {
    readonly uuid: string;

    readonly type: T;

    createdAt = now();

    status: MessageStatus;

    error: string | undefined = undefined;

    constructor(uuid: string, type: T) {
        this.uuid = uuid;
        this.type = type;
        this.status = (type === 'userRequest' || type === 'toolUse') ? 'read' : 'generating';
    }

    markStatus(status: MessageStatus) {
        this.status = status;
    }

    setError(reason: string) {
        this.error = reason;
    }

    protected restore(persistData: MessagePersistData) {
        this.createdAt = persistData.createdAt;
        this.status = persistData.status;
        this.error = persistData.error;
    }

    abstract toMessageData(): MessageData;

    abstract toChatInputPayload(): ChatInputPayload;

    abstract toPersistData(): MessagePersistData;

    protected toMessageDataBase(): MessageDataBase {
        return {
            uuid: this.uuid,
            createdAt: this.createdAt,
            status: this.status,
            error: this.error,
        };
    }
}

export class UserRequestMessage extends MessageBase<'userRequest'> {
    static from(data: UserRequestMessagePersistData) {
        const message = new UserRequestMessage(data.uuid, data.textContent);
        message.restore(data);
        return message;
    }

    content: string;

    constructor(uuid: string, content: string) {
        super(uuid, 'userRequest');
        this.content = content;
    }

    toMessageData(): MessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            content: this.content,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'user',
            content: this.content,
        };
    }

    toPersistData(): UserRequestMessagePersistData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            textContent: this.content,
        };
    }

    protected restore(persistData: UserRequestMessagePersistData) {
        super.restore(persistData);
        this.content = persistData.textContent;
    }
}

abstract class AssistantMessage<T extends 'assistantText' | 'toolCall'> extends MessageBase<T> {
    textContent = '';

    protected readonly chunks: Array<string | ToolCallMessageChunk> = [];

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(uuid: string, type: T) {
        super(uuid, type);
    }

    toMessageData(): MessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            chunks: this.chunks,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'assistant',
            content: this.textContent,
        };
    }

    protected restore(persistData: AssistantTextMessagePersistData | ToolCallMessagePersistData) {
        super.restore(persistData);
        this.textContent = persistData.textContent;
        this.chunks.push(...persistData.chunks);
    }
}

export class ToolCallMessage extends AssistantMessage<'toolCall'> {
    static from(data: ToolCallMessagePersistData) {
        const message = new ToolCallMessage(data);
        return message;
    }

    constructor(source: AssistantTextMessagePersistData | ToolCallMessagePersistData) {
        super(source.uuid, 'toolCall');
        this.restore(source);
    }

    toPersistData(): ToolCallMessagePersistData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            textContent: this.textContent,
            chunks: this.chunks,
        };
    }

    getToolCallInput(): ToolCallInput {
        const toolCall = this.chunks.find(v => typeof v !== 'string');

        if (!toolCall) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        return {
            name: toolCall.toolName,
            arguments: toolCall.arguments as any,
        };
    }

    // TODO: Validation
}

export class AssistantTextMessage extends AssistantMessage<'assistantText'> {
    static from(data: AssistantTextMessagePersistData) {
        const message = new AssistantTextMessage(data.uuid);
        message.restore(data);
        return message;
    }

    constructor(uuid: string) {
        super(uuid, 'assistantText');
    }

    addChunk(chunk: ToolParsedChunk) {
        if (chunk.type === 'text') {
            this.textContent += chunk.content;
            const lastChunk = this.chunks.at(-1);
            if (typeof lastChunk === 'string') {
                this.chunks[this.chunks.length - 1] = lastChunk + chunk.content;
            }
            else {
                this.chunks.push(chunk.content);
            }
            return;
        }

        if (chunk.type === 'textInTool') {
            this.textContent += chunk.source;
            return;
        }

        this.textContent += chunk.source;

        if (chunk.type === 'toolStart') {
            this.chunks.push({toolName: chunk.toolName, arguments: {}, status: 'generating'});
            return;
        }

        const lastToolCall = this.chunks.at(-1);

        if (typeof lastToolCall !== 'object') {
            throw new Error('Unexpected tool call chunk coming without a start chunk');
        }

        if (chunk.type === 'toolDelta') {
            for (const [key, value] of Object.entries(chunk.arguments)) {
                const previousValue = lastToolCall.arguments[key] ?? '';
                lastToolCall.arguments[key] = previousValue + value;
            }
            return;
        }

        lastToolCall.status = 'completed';
    }

    toPersistData(): AssistantTextMessagePersistData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            textContent: this.textContent,
            chunks: this.chunks,
        };
    }

    toToolCallMessage(): ToolCallMessage | null {
        if (this.chunks.some(v => typeof v !== 'string')) {
            return new ToolCallMessage(this.toPersistData());
        }
        return null;
    }
}

export class ToolUseMessage extends MessageBase<'toolUse'> {
    static from(data: ToolUseMessagePersistData) {
        const message = new ToolUseMessage(data.uuid, data.textContent);
        message.restore(data);
        return message;
    }

    content: string;

    constructor(uuid: string, content: string) {
        super(uuid, 'toolUse');

        this.content = content;
    }

    toMessageData(): MessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            content: this.content,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'user',
            content: this.content,
        };
    }

    toPersistData(): MessagePersistData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            textContent: this.content,
        };
    }

    protected restore(persistData: ToolUseMessagePersistData) {
        super.restore(persistData);
        this.content = persistData.textContent;
    }
}

export type Message = UserRequestMessage | AssistantTextMessage | ToolCallMessage | ToolUseMessage;

export function deserializeMessage(data: MessagePersistData): Message {
    switch (data.type) {
        case 'userRequest':
            return UserRequestMessage.from(data);
        case 'assistantText':
            return AssistantTextMessage.from(data);
        case 'toolCall':
            return ToolCallMessage.from(data);
        case 'toolUse':
            return ToolUseMessage.from(data);
        default:
            assertNever<{type: string}>(data, v => `Unknown message type ${v.type}`);
    }
}
