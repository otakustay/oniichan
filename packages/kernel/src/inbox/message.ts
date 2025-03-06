import {assertHasValue, assertNever} from '@oniichan/shared/error';
import {ChatInputPayload} from '@oniichan/shared/model';
import {now} from '@oniichan/shared/string';
import {
    MessageType,
    MessageData,
    UserRequestMessageData,
    AssistantTextMessageData,
    ToolCallMessageData,
    ToolCallMessageChunk,
    ToolUseMessageData,
    MessageDataBase,
    assertToolCallChunk,
    chunkToString,
    MessageInputChunk,
    WorkflowSourceChunkStatus,
    AssistantTextMessageContentChunk,
    ToolCallMessageContentChunk,
    ParsedToolCallMessageChunk,
    WorkflowChunkStatus,
    assertTaggedChunk,
    isContentfulChunk,
    TaggedMessageChunk,
    MessageViewChunk,
    PlanMessageData,
    PlanMessageContentChunk,
    AssistantMessageType,
    PlanMessageChunk,
    assertPlanChunk,
} from '@oniichan/shared/inbox';
import {
    InboxAssistantTextMessage,
    InboxMessage,
    InboxPlanMessage,
    InboxRoundtrip,
    InboxToolCallMessage,
    InboxToolUseMessage,
    InboxUserRequestMessage,
    PlanState,
} from './interface';
import {ContentTagName} from '@oniichan/shared/tool';

abstract class MessageBase<T extends MessageType> implements InboxMessage<T> {
    readonly uuid: string;

    readonly type: T;

    protected readonly roundtrip: InboxRoundtrip;

    private createdAt = now();

    private error: string | undefined = undefined;

    constructor(uuid: string, type: T, roundtrip: InboxRoundtrip) {
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

    abstract toChatInputPayload(): ChatInputPayload;

    protected toMessageDataBase(): MessageDataBase {
        return {
            uuid: this.uuid,
            createdAt: this.createdAt,
            error: this.error,
        };
    }
}

export class UserRequestMessage extends MessageBase<'userRequest'> implements InboxUserRequestMessage {
    static from(data: UserRequestMessageData, roundtrip: InboxRoundtrip) {
        const message = new UserRequestMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: InboxRoundtrip, content: string) {
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

type ResolvedAssistantChunkType<T extends AssistantMessageType> = T extends 'assistantText'
    ? AssistantTextMessageContentChunk
    : (
        T extends 'toolCall' ? ToolCallMessageContentChunk
            : (
                T extends 'plan' ? PlanMessageContentChunk
                    : null
            )
    );

abstract class AssistantMessage<T extends AssistantMessageType> extends MessageBase<T> {
    protected readonly chunks: Array<ResolvedAssistantChunkType<T>> = [];

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(uuid: string, type: T, roundtrip: InboxRoundtrip) {
        super(uuid, type, roundtrip);
    }

    getTextContent() {
        return this.chunks.filter(v => v.type !== 'reasoning').map(chunkToString).join('');
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'assistant',
            content: this.getModelVisibleTextContent(),
        };
    }

    private getModelVisibleTextContent() {
        return this.chunks.filter(isContentfulChunk).map(chunkToString).join('');
    }
}

export class PlanMessage extends AssistantMessage<'plan'> implements InboxPlanMessage {
    static from(data: PlanMessageData, roundtrip: InboxRoundtrip) {
        const message = new PlanMessage(roundtrip, data);
        return message;
    }

    constructor(roundtrip: InboxRoundtrip, source: PlanMessageData) {
        super(source.uuid, 'plan', roundtrip);
        this.restore(source);
    }

    getWorkflowOriginStatus(): WorkflowChunkStatus {
        return 'completed';
    }

    markWorkflowOriginStatus(): void {
    }

    toMessageData(): PlanMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            chunks: this.chunks,
        };
    }

    getPlanState(): PlanState {
        if (this.chunks.some(v => v.type === 'plan')) {
            return 'plan';
        }
        return 'conclusion';
    }

    protected restore(persistData: PlanMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}

export class ToolCallMessage extends AssistantMessage<'toolCall'> implements InboxToolCallMessage {
    static from(data: ToolCallMessageData, roundtrip: InboxRoundtrip) {
        const message = new ToolCallMessage(roundtrip, data);
        return message;
    }

    constructor(roundtrip: InboxRoundtrip, source: ToolCallMessageData) {
        super(source.uuid, 'toolCall', roundtrip);
        this.restore(source);
    }

    toMessageData(): ToolCallMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            chunks: this.chunks,
        };
    }

    findToolCallChunkStrict(): ParsedToolCallMessageChunk {
        const chunk = this.chunks.find(v => v.type === 'parsedToolCall');

        if (!chunk) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        return chunk;
    }

    getWorkflowOriginStatus(): WorkflowChunkStatus {
        const chunk = this.findToolCallChunkStrict();
        return chunk.status;
    }

    markWorkflowOriginStatus(status: WorkflowChunkStatus) {
        const chunk = this.findToolCallChunkStrict();
        chunk.status = status;
    }

    protected restore(persistData: ToolCallMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}

export class AssistantTextMessage extends AssistantMessage<'assistantText'> implements InboxAssistantTextMessage {
    static from(data: AssistantTextMessageData, roundtrip: InboxRoundtrip) {
        const message = new AssistantTextMessage(data.uuid, roundtrip);
        message.restore(data);
        return message;
    }

    constructor(uuid: string, roundtrip: InboxRoundtrip) {
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

        if (chunk.type === 'contentStart') {
            this.chunks.push({type: 'content', tagName: chunk.tagName, content: '', status: 'generating'});
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
        else if (chunk.type === 'contentDelta') {
            assertTaggedChunk(lastChunk, 'Unexpected thinking delta chunk coming without a start chunk');
            lastChunk.content += chunk.source;
        }
        else if (chunk.type === 'contentEnd') {
            assertTaggedChunk(lastChunk, 'Unexpected thinking end chunk coming without a start chunk');
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
            lastChunk.status = 'waitingValidate';
            lastChunk.source += chunk.source;
            return;
        }
        else if (chunk.type === 'textInTool') {
            assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
            lastChunk.source += chunk.source;
        }
        else if (chunk.type === 'planStart') {
            this.chunks.push({type: 'plan', tasks: [], status: 'generating', source: chunk.source});
        }
        else if (chunk.type === 'planTaskStart') {
            assertPlanChunk(lastChunk, 'Unexpected plan task start chunk coming without a plan start chunk');
            lastChunk.source += chunk.source;
            lastChunk.tasks.push({taskType: chunk.taskType, text: ''});
        }
        else if (chunk.type === 'planTaskDelta') {
            assertPlanChunk(lastChunk, 'Unexpected plan task start chunk coming without a plan start chunk');
            lastChunk.source += chunk.source;
            const task = lastChunk.tasks.at(-1);

            if (!task) {
                throw new Error('Unexpected plan task delta chunk coming without an existing task');
            }
            if (task.taskType !== chunk.taskType) {
                throw new Error('Unexpected plan task delta chunk coming without corresponding task');
            }

            task.text += chunk.source;
        }
        else if (chunk.type === 'planTaskEnd') {
            assertPlanChunk(lastChunk, 'Unexpected plan task start chunk coming without a plan start chunk');
            lastChunk.source += chunk.source;
            const task = lastChunk.tasks.at(-1);

            if (!task) {
                throw new Error('Unexpected plan task end chunk coming without an existing task');
            }
            if (task.taskType !== chunk.taskType) {
                throw new Error('Unexpected plan task end chunk coming without corresponding task');
            }
        }
        else if (chunk.type === 'planEnd') {
            assertPlanChunk(lastChunk, 'Unexpected plan end chunk coming without a plan start chunk');
            lastChunk.source += chunk.source;
            lastChunk.status = 'completed';
        }
        else if (chunk.type === 'textInPlan') {
            assertPlanChunk(lastChunk, 'Unexpected text in plan chunk coming without a plan start chunk');
            lastChunk.source += chunk.source;
        }
        else {
            assertNever<{type: string}>(chunk, v => `Unexpected chunk type: ${v.type}`);
        }
    }

    toMessageData(): AssistantTextMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            chunks: this.chunks,
        };
    }

    getWorkflowSourceStatus(): WorkflowSourceChunkStatus {
        const chunk = this.findToolCallChunk();
        return chunk?.status ?? 'validated';
    }

    markWorkflowSourceStatus(status: WorkflowSourceChunkStatus) {
        // Tool call
        const chunk = this.findToolCallChunk();
        if (chunk) {
            chunk.status = status;
        }
        // Plan has no status
    }

    findPlanChunk(): PlanMessageChunk | null {
        return this.chunks.find(v => v.type === 'plan') ?? null;
    }

    findPlanChunkStrict(): PlanMessageChunk {
        const chunk = this.findPlanChunk();
        return assertHasValue(chunk, 'Message does not contain plan chunk');
    }

    findTaggedChunk(tagName: ContentTagName): TaggedMessageChunk | null {
        const isTaggedChunk = (chunk: MessageViewChunk, tagName: string): chunk is TaggedMessageChunk => {
            return chunk.type === 'content' && chunk.tagName === tagName;
        };
        return this.chunks.find(v => isTaggedChunk(v, tagName)) ?? null;
    }

    findTaggedChunkStrict(tagName: ContentTagName): TaggedMessageChunk {
        const chunk = this.findTaggedChunk(tagName);
        return assertHasValue(chunk, `Message does not contain content chunk tagged as ${tagName}`);
    }

    findToolCallChunk() {
        return this.chunks.find(v => v.type === 'toolCall') ?? null;
    }

    findToolCallChunkStrict() {
        const chunk = this.findToolCallChunk();
        return assertHasValue(chunk, 'Message does not contain tool call chunk');
    }

    replaceToolCallChunk(newChunk: ToolCallMessageChunk) {
        const index = this.chunks.findIndex(v => v.type === 'toolCall');

        if (index < 0) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        this.chunks[index] = newChunk;
    }

    protected restore(persistData: AssistantTextMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}

export class ToolUseMessage extends MessageBase<'toolUse'> implements InboxToolUseMessage {
    static from(data: ToolUseMessageData, roundtrip: InboxRoundtrip) {
        const message = new ToolUseMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: InboxRoundtrip, content: string) {
        super(uuid, 'toolUse', roundtrip);

        this.content = content;
    }

    toMessageData(): ToolUseMessageData {
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

export type Message = UserRequestMessage | AssistantTextMessage | PlanMessage | ToolCallMessage | ToolUseMessage;

export function deserializeMessage(data: MessageData, roundtrip: InboxRoundtrip): Message {
    switch (data.type) {
        case 'userRequest':
            return UserRequestMessage.from(data, roundtrip);
        case 'assistantText':
            return AssistantTextMessage.from(data, roundtrip);
        case 'plan':
            return PlanMessage.from(data, roundtrip);
        case 'toolCall':
            return ToolCallMessage.from(data, roundtrip);
        case 'toolUse':
            return ToolUseMessage.from(data, roundtrip);
        default:
            assertNever<{type: string}>(data, v => `Unknown message type ${v.type}`);
    }
}
