import {assertNever} from '../error';
import {ChatInputPayload} from '../model';
import {now} from '../string';
import {ModelToolCallInput, ModelToolCallInputWithSource, ToolName, ToolParsedChunk} from '../tool';

export interface TextMessageChunk {
    type: 'text';
    content: string;
}

/** Text that should be render directly without formatting to markdown */
export interface PlainTextMessageChunk {
    type: 'plainText';
    content: string;
}

export interface ToolCallMessageChunk {
    type: 'toolCall';
    toolName: ToolName;
    arguments: Record<string, string>;
    status: 'generating' | 'completed';
    source: string;
}

export interface EmbeddingSearchResultItem {
    file: string;
    startLine: number;
    endLine: number;
    content: string;
}

export interface EmbeddingSearchMessageChunk {
    type: 'embeddingSearch';
    query: string;
    results: EmbeddingSearchResultItem[];
}

export interface ThinkingMessageChunk {
    type: 'thinking';
    content: string;
    status: 'generating' | 'completed';
}

export type MessageContentChunk = TextMessageChunk | ToolCallMessageChunk | ThinkingMessageChunk;

export type DebugContentChunk = TextMessageChunk | PlainTextMessageChunk | EmbeddingSearchMessageChunk;

export type MessageViewChunk = MessageContentChunk | DebugContentChunk;

function chunkToString(chunk: MessageContentChunk) {
    switch (chunk.type) {
        case 'text':
            return chunk.content;
        case 'thinking':
            return `<thinking>${chunk.content}</thinking>`;
        case 'toolCall':
            return chunk.source;
        default:
            assertNever<{type: string}>(chunk, v => `Unknown chunk type ${v.type}`);
    }
}

interface MessageDataBase {
    uuid: string;
    createdAt: string;
    error?: string | undefined;
}

export type DebugMessageLevel = 'error' | 'warning' | 'info';

export interface DebugMessageData extends MessageDataBase {
    type: 'debug';
    level: DebugMessageLevel;
    title: string;
    content: DebugContentChunk;
}

export interface UserRequestMessageData extends MessageDataBase {
    type: 'userRequest';
    content: string;
}

export interface AssistantTextMessageData extends MessageDataBase {
    type: 'assistantText';
    chunks: MessageContentChunk[];
}

export interface ToolCallMessageData extends MessageDataBase {
    type: 'toolCall';
    chunks: MessageContentChunk[];
}

export interface ToolUseMessageData extends MessageDataBase {
    type: 'toolUse';
    content: string;
}

export type MessageData =
    | DebugMessageData
    | UserRequestMessageData
    | AssistantTextMessageData
    | ToolCallMessageData
    | ToolUseMessageData;

export type MessageType = MessageData['type'];

export function isToolCallChunk(chunk: MessageContentChunk): chunk is ToolCallMessageChunk {
    return chunk.type === 'toolCall';
}

export function isReactiveToolCallChunk(chunk: MessageContentChunk) {
    return isToolCallChunk(chunk)
        && chunk.toolName !== 'ask_followup_question'
        && chunk.toolName !== 'attempt_completion';
}

export function isAssistantMessage(type: MessageType) {
    return type === 'assistantText' || type === 'toolCall';
}

abstract class MessageBase<T extends MessageType> {
    readonly uuid: string;

    readonly type: T;

    createdAt = now();

    error: string | undefined = undefined;

    constructor(uuid: string, type: T) {
        this.uuid = uuid;
        this.type = type;
    }

    setError(reason: string) {
        this.error = reason;
    }

    protected restore(persistData: MessageData) {
        this.createdAt = persistData.createdAt;
        this.error = persistData.error;
    }

    abstract toMessageData(): MessageData;

    abstract toChatInputPayload(): ChatInputPayload | null;

    protected toMessageDataBase(): MessageDataBase {
        return {
            uuid: this.uuid,
            createdAt: this.createdAt,
            error: this.error,
        };
    }
}

export class DebugMessage extends MessageBase<'debug'> {
    readonly level: DebugMessageLevel;

    readonly title: string;

    readonly content: DebugContentChunk;

    constructor(uuid: string, level: DebugMessageLevel, title: string, content: DebugContentChunk) {
        super(uuid, 'debug');
        this.level = level;
        this.title = title;
        this.content = content;
    }

    toMessageData(): DebugMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            level: this.level,
            title: this.title,
            content: this.content,
        };
    }

    // Debug message do not participate in chat
    toChatInputPayload(): ChatInputPayload | null {
        return null;
    }
}

export class UserRequestMessage extends MessageBase<'userRequest'> {
    static from(data: UserRequestMessageData) {
        const message = new UserRequestMessage(data.uuid, data.content);
        message.restore(data);
        return message;
    }

    content: string;

    constructor(uuid: string, content: string) {
        super(uuid, 'userRequest');
        this.content = content;
    }

    toMessageData(): UserRequestMessageData {
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

    protected restore(persistData: UserRequestMessageData) {
        super.restore(persistData);
        this.content = persistData.content;
    }
}

abstract class AssistantMessage<T extends 'assistantText' | 'toolCall'> extends MessageBase<T> {
    protected readonly chunks: MessageContentChunk[] = [];

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(uuid: string, type: T) {
        super(uuid, type);
    }

    getTextContent() {
        return this.chunks.map(chunkToString).join('');
    }

    toMessageData(): AssistantTextMessageData | ToolCallMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            chunks: this.chunks,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'assistant',
            content: this.getTextContent(),
        };
    }

    protected restore(persistData: AssistantTextMessageData | ToolCallMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}

export class ToolCallMessage extends AssistantMessage<'toolCall'> {
    static from(data: ToolCallMessageData) {
        const message = new ToolCallMessage(data);
        return message;
    }

    constructor(source: AssistantTextMessageData | ToolCallMessageData) {
        super(source.uuid, 'toolCall');
        this.restore(source);
    }

    getToolCallInput(): ModelToolCallInput {
        const toolCall = this.findToolCallChunkStrict();

        return {
            name: toolCall.toolName,
            arguments: toolCall.arguments,
        };
    }

    getToolCallInputWithSource(): ModelToolCallInputWithSource {
        const toolCall = this.findToolCallChunkStrict();

        return {
            name: toolCall.toolName,
            arguments: toolCall.arguments,
            source: toolCall.source,
        };
    }

    replaceToolCallInput(input: ModelToolCallInputWithSource) {
        const index = this.chunks.findIndex(isToolCallChunk);

        if (index < 0) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        this.chunks[index] = {
            type: 'toolCall',
            toolName: input.name,
            arguments: input.arguments,
            status: 'completed',
            source: input.source,
        };
    }

    toMessageData(): ToolCallMessageData {
        return {
            ...super.toMessageData(),
            type: this.type,
        };
    }

    private findToolCallChunkStrict() {
        const chunk = this.chunks.find(isToolCallChunk);

        if (!chunk) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        return chunk;
    }
}

type MaybeChunk = MessageContentChunk | undefined;

function assertThinkingChunk(chunk: MaybeChunk, message: string): asserts chunk is ThinkingMessageChunk {
    if (chunk?.type !== 'thinking') {
        throw new Error(message);
    }
}

function assertToolCallChunk(chunk: MaybeChunk, message: string): asserts chunk is ToolCallMessageChunk {
    if (chunk?.type !== 'toolCall') {
        throw new Error(message);
    }
}

export class AssistantTextMessage extends AssistantMessage<'assistantText'> {
    static from(data: AssistantTextMessageData) {
        const message = new AssistantTextMessage(data.uuid);
        message.restore(data);
        return message;
    }

    constructor(uuid: string) {
        super(uuid, 'assistantText');
    }

    addChunk(chunk: ToolParsedChunk) {
        if (chunk.type === 'text') {
            const lastChunk = this.chunks.at(-1);
            if (lastChunk?.type === 'text') {
                lastChunk.content += chunk.content;
            }
            else {
                this.chunks.push({type: 'text', content: chunk.content});
            }
            return;
        }

        const lastChunk = this.chunks.at(-1);

        if (chunk.type === 'thinkingStart') {
            this.chunks.push({type: 'thinking', content: '', status: 'generating'});
        }
        else if (chunk.type === 'toolStart') {
            const toolChunk: ToolCallMessageChunk = {
                type: 'toolCall',
                toolName: chunk.toolName,
                arguments: {},
                status: 'generating',
                source: chunk.source,
            };
            this.chunks.push(toolChunk);
        }
        else if (chunk.type === 'thinkingDelta') {
            assertThinkingChunk(lastChunk, 'Unexpected thinking delta chunk coming without a start chunk');
            lastChunk.content += chunk.source;
        }
        else if (chunk.type === 'thinkingEnd') {
            assertThinkingChunk(lastChunk, 'Unexpected thinking end chunk coming without a start chunk');
            lastChunk.status = 'completed';
        }
        else if (chunk.type === 'toolDelta') {
            assertToolCallChunk(lastChunk, 'Unexpected tool delta chunk coming without a start chunk');
            lastChunk.source += chunk.source;
            for (const [key, value] of Object.entries(chunk.arguments)) {
                const previousValue = lastChunk.arguments[key] ?? '';
                lastChunk.arguments[key] = previousValue + value;
            }
        }
        else if (chunk.type === 'toolEnd') {
            assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
            lastChunk.status = 'completed';
            lastChunk.source += chunk.source;
            return;
        }
        else if (chunk.type === 'textInTool') {
            assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
            lastChunk.source += chunk.source;
        }
        else {
            assertNever<{type: string}>(chunk, v => `Unexpected chunk type: ${v.type}`);
        }
    }

    toMessageData(): AssistantTextMessageData {
        return {
            ...super.toMessageData(),
            type: this.type,
        };
    }

    toToolCallMessage(): ToolCallMessage | null {
        if (this.chunks.some(isReactiveToolCallChunk)) {
            return new ToolCallMessage(this.toMessageData());
        }
        return null;
    }
}

export class ToolUseMessage extends MessageBase<'toolUse'> {
    static from(data: ToolUseMessageData) {
        const message = new ToolUseMessage(data.uuid, data.content);
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

    protected restore(persistData: ToolUseMessageData) {
        super.restore(persistData);
        this.content = persistData.content;
    }
}

export type Message = DebugMessage | UserRequestMessage | AssistantTextMessage | ToolCallMessage | ToolUseMessage;

export function deserializeMessage(data: MessageData): Message {
    switch (data.type) {
        case 'userRequest':
            return UserRequestMessage.from(data);
        case 'assistantText':
            return AssistantTextMessage.from(data);
        case 'toolCall':
            return ToolCallMessage.from(data);
        case 'toolUse':
            return ToolUseMessage.from(data);
        case 'debug':
            throw new Error('Unexpected debug message on deserialization');
        default:
            assertNever<{type: string}>(data, v => `Unknown message type ${v.type}`);
    }
}
