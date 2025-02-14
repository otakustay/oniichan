import {assertNever} from '@oniichan/shared/error';
import {ChatInputPayload} from '@oniichan/shared/model';
import {now} from '@oniichan/shared/string';
import {ModelToolCallInput, ModelToolCallInputWithSource, ToolParsedChunk} from '@oniichan/shared/tool';
import {
    MessageType,
    MessageData,
    DebugMessageLevel,
    DebugContentChunk,
    DebugMessageData,
    UserRequestMessageData,
    MessageContentChunk,
    AssistantTextMessageData,
    ToolCallMessageData,
    ToolCallMessageChunk,
    ToolUseMessageData,
    MessageDataBase,
    isToolCallChunk,
    isReactiveToolCallChunk,
    assertThinkingChunk,
    assertToolCallChunk,
    chunkToString,
    normalizeArguments,
} from '@oniichan/shared/inbox';

abstract class MessageBase<T extends MessageType> {
    readonly uuid: string;

    readonly type: T;

    private createdAt = now();

    private error: string | undefined = undefined;

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
    private readonly level: DebugMessageLevel;

    private readonly title: string;

    private readonly content: DebugContentChunk;

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

    readonly content: string;

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
            content: this.getModelVisibleTextContent(),
        };
    }

    protected restore(persistData: AssistantTextMessageData | ToolCallMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }

    private getModelVisibleTextContent() {
        return this.chunks.filter(v => v.type !== 'thinking').map(chunkToString).join('');
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

    getToolCallInputWithSource(): ModelToolCallInputWithSource {
        const toolCall = this.findToolCallChunkStrict();

        return {
            name: toolCall.toolName,
            arguments: normalizeArguments(toolCall.arguments),
            source: toolCall.source,
        };
    }

    getToolCallInput(): ModelToolCallInput {
        const withSource = this.getToolCallInputWithSource();
        return {
            name: withSource.name,
            arguments: withSource.arguments,
        };
    }

    replaceToolCallInput(input: ModelToolCallInputWithSource) {
        const chunk = this.findToolCallChunkStrict();
        const index = this.chunks.indexOf(chunk);

        if (index < 0) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        this.chunks[index] = {
            type: 'toolCall',
            toolName: input.name,
            arguments: input.arguments,
            status: chunk.status,
            source: input.source,
        };
    }

    completeToolCall() {
        const chunk = this.findToolCallChunkStrict();
        chunk.status = 'completed';
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

    // TODO: Snapshot file edit
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

    readonly content: string;

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
