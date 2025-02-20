import {assertNever, stringifyError} from '@oniichan/shared/error';
import {ChatInputPayload} from '@oniichan/shared/model';
import {now} from '@oniichan/shared/string';
import {isEditToolName, ModelToolCallInput, ModelToolCallInputWithSource} from '@oniichan/shared/tool';
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
    MessageInputChunk,
} from '@oniichan/shared/inbox';
import {EditorHost} from '../core/editor';
import {MessageRoundrip} from './interface';
import {createFileEdit, stackFileEdit} from '@oniichan/shared/patch';

abstract class MessageBase<T extends MessageType> {
    readonly uuid: string;

    readonly type: T;

    protected readonly roundtrip: MessageRoundrip;

    private createdAt = now();

    private error: string | undefined = undefined;

    constructor(uuid: string, type: T, roundtrip: MessageRoundrip) {
        this.uuid = uuid;
        this.type = type;
        this.roundtrip = roundtrip;
    }

    getRoundtrip() {
        return this.roundtrip;
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

interface DebugInit {
    level: DebugMessageLevel;
    title: string;
    content: DebugContentChunk;
}

export class DebugMessage extends MessageBase<'debug'> {
    private readonly level: DebugMessageLevel;

    private readonly title: string;

    private readonly content: DebugContentChunk;

    constructor(uuid: string, roundtrip: MessageRoundrip, init: DebugInit) {
        super(uuid, 'debug', roundtrip);
        this.level = init.level;
        this.title = init.title;
        this.content = init.content;
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
    static from(data: UserRequestMessageData, roundtrip: MessageRoundrip) {
        const message = new UserRequestMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: MessageRoundrip, content: string) {
        super(uuid, 'userRequest', roundtrip);
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
    constructor(uuid: string, type: T, roundtrip: MessageRoundrip) {
        super(uuid, type, roundtrip);
    }

    getTextContent() {
        return this.chunks.filter(v => v.type !== 'reasoning').map(chunkToString).join('');
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
        return this.chunks.filter(v => v.type !== 'reasoning' && v.type !== 'thinking').map(chunkToString).join('');
    }
}

export class ToolCallMessage extends AssistantMessage<'toolCall'> {
    static from(data: ToolCallMessageData, roundtrip: MessageRoundrip) {
        const message = new ToolCallMessage(roundtrip, data);
        return message;
    }

    constructor(roundtrip: MessageRoundrip, source: AssistantTextMessageData | ToolCallMessageData) {
        super(source.uuid, 'toolCall', roundtrip);
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

    async replaceToolCallInput(input: ModelToolCallInputWithSource, editorHost: EditorHost) {
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
            fileEdit: null,
            source: input.source,
        };
        await this.takeFileEditSnapshot(editorHost);
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

    getFileEdit() {
        const toolCall = this.findToolCallChunkStrict();

        return isEditToolName(toolCall.toolName) ? toolCall.fileEdit : null;
    }

    async takeFileEditSnapshot(editorHost: EditorHost) {
        const toolCall = this.findToolCallChunkStrict();

        if (toolCall.fileEdit || toolCall.status === 'generating') {
            return;
        }

        if (isEditToolName(toolCall.toolName)) {
            const file = toolCall.arguments.path ?? '';

            if (!file) {
                toolCall.fileEdit = {
                    file,
                    type: 'error',
                    message: 'Missing path argument',
                };
                return;
            }

            const editStack = this.roundtrip.getEditStackForFile(toolCall.arguments.path ?? '');
            const previousEdit = editStack.at(-1);
            const patchAction = toolCall.toolName === 'write_file'
                ? 'write'
                : (toolCall.toolName === 'patch_file' ? 'patch' : 'delete');
            // `patch` for `patch_file`, `content` for `write_file`
            const patch = toolCall.arguments.patch ?? toolCall.arguments.content ?? '';

            if (previousEdit) {
                toolCall.fileEdit = stackFileEdit(previousEdit, patchAction, patch);
            }
            else {
                try {
                    const content = await editorHost.call('readWorkspaceFile', file);
                    toolCall.fileEdit = createFileEdit(file, content, patchAction, patch);
                }
                catch (ex) {
                    toolCall.fileEdit = {
                        file,
                        type: 'error',
                        message: stringifyError(ex),
                    };
                }
            }
        }
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
    static from(data: AssistantTextMessageData, roundtrip: MessageRoundrip) {
        const message = new AssistantTextMessage(data.uuid, roundtrip);
        message.restore(data);
        return message;
    }

    constructor(uuid: string, roundtrip: MessageRoundrip) {
        super(uuid, 'assistantText', roundtrip);
    }

    addChunk(chunk: MessageInputChunk) {
        // Reasoning chunk should be unique and on top of all chunks
        if (chunk.type === 'reasoning') {
            const firstChunk = this.chunks.at(0);

            if (firstChunk?.type === 'reasoning') {
                firstChunk.content += chunk.content;
            }
            else {
                this.chunks.unshift({type: 'reasoning', content: chunk.content});
            }

            return;
        }

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
                fileEdit: null,
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

    async toToolCallMessage(editorHost: EditorHost): Promise<ToolCallMessage | null> {
        if (this.chunks.some(isReactiveToolCallChunk)) {
            const message = new ToolCallMessage(this.roundtrip, this.toMessageData());
            await message.takeFileEditSnapshot(editorHost);
            return message;
        }

        return null;
    }
}

export class ToolUseMessage extends MessageBase<'toolUse'> {
    static from(data: ToolUseMessageData, roundtrip: MessageRoundrip) {
        const message = new ToolUseMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: MessageRoundrip, content: string) {
        super(uuid, 'toolUse', roundtrip);

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

export function deserializeMessage(data: MessageData, roundtrip: MessageRoundrip): Message {
    switch (data.type) {
        case 'userRequest':
            return UserRequestMessage.from(data, roundtrip);
        case 'assistantText':
            return AssistantTextMessage.from(data, roundtrip);
        case 'toolCall':
            return ToolCallMessage.from(data, roundtrip);
        case 'toolUse':
            return ToolUseMessage.from(data, roundtrip);
        case 'debug':
            throw new Error('Unexpected debug message on deserialization');
        default:
            assertNever<{type: string}>(data, v => `Unknown message type ${v.type}`);
    }
}
