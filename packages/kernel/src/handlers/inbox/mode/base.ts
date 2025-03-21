import {over} from '@otakustay/async-iterator';
import type {InboxPromptReference} from '@oniichan/prompt';
import type {Logger} from '@oniichan/shared/logger';
import type {ChatInputPayload, ModelResponse} from '@oniichan/shared/model';
import type {InboxConfig} from '@oniichan/editor-host/protocol';
import type {AssistantRole, MessageInputChunk, ReasoningMessageChunk} from '@oniichan/shared/inbox';
import type {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {duplicate, merge} from '@oniichan/shared/iterable';
import type {ModelAccessHost, ModelChatOptions} from '../../../core/model';
import type {EditorHost} from '../../../core/editor';
import type {InboxMessage, InboxMessageThread, InboxRoundtrip} from '../../../inbox';

export interface ChatContextProviderInit {
    logger: Logger;
    references: InboxPromptReference[];
    modelAccess: ModelAccessHost;
    editorHost: EditorHost;
    thread: InboxMessageThread;
    roundtrip: InboxRoundtrip;
    config: InboxConfig;
    telemetry: FunctionUsageTelemetry;
}

export abstract class ChatContextProvider {
    protected readonly logger: Logger;

    protected readonly references: InboxPromptReference[];

    protected readonly modelAccess: ModelAccessHost;

    protected readonly editorHost: EditorHost;

    protected readonly thread: InboxMessageThread;

    protected readonly roundtrip: InboxRoundtrip;

    protected readonly config: InboxConfig;

    private readonly telemetry: FunctionUsageTelemetry;

    constructor(init: ChatContextProviderInit) {
        this.logger = init.logger.with({source: this.constructor.name});
        this.references = init.references;
        this.modelAccess = init.modelAccess;
        this.editorHost = init.editorHost;
        this.thread = init.thread;
        this.roundtrip = init.roundtrip;
        this.config = init.config;
        this.telemetry = init.telemetry;
    }

    async *provideChatStream(): AsyncIterable<MessageInputChunk> {
        yield* this.chat();
    }

    abstract provideAssistantRole(): Promise<AssistantRole>;

    protected async *chat(overrides?: Partial<ModelChatOptions>): AsyncIterable<MessageInputChunk> {
        const tasks = [
            this.provideModelName(),
            this.provideSystemPrompt(),
            this.provideChatMessages(),
        ] as const;
        const [overrideModelName, systemPrompt, messages] = await Promise.all(tasks);
        const modelTelemetry = this.telemetry.createModelTelemetry();
        const options: ModelChatOptions = {
            messages,
            systemPrompt,
            overrideModelName,
            telemetry: modelTelemetry,
            ...overrides,
        };
        yield* this.consumeChatStream(this.modelAccess.chatStreaming(options));
    }

    protected abstract provideModelName(): Promise<string | undefined>;

    protected abstract provideSystemPrompt(): Promise<string>;

    protected abstract provideChatMessages(): Promise<ChatInputPayload[]>;

    protected getInboxMessages(): InboxMessage[] {
        const messages = this.thread.toMessages();
        const last = messages.at(-1);
        // Reply is created before we form the message list,
        // remove it to avoid tailing assistant message in model request
        if (last?.type === 'assistantText') {
            messages.pop();
        }
        return messages;
    }

    protected consumeChatStream(chatStream: AsyncIterable<ModelResponse>): AsyncIterable<MessageInputChunk> {
        const parser = new StreamingToolParser();
        const [reasoningFork, textFork] = duplicate(chatStream);
        const reasoningStream = over(reasoningFork)
            .filter(v => v.type === 'reasoning')
            .map((v: ModelResponse): ReasoningMessageChunk => ({type: 'reasoning', content: v.content}));
        const textStream = over(textFork).filter(v => v.type === 'text').map(v => v.content);
        return merge(reasoningStream, parser.parse(textStream));
    }
}
