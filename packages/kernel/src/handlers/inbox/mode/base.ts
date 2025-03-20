import type {InboxPromptReference} from '@oniichan/prompt';
import type {Logger} from '@oniichan/shared/logger';
import type {ChatInputPayload, ModelResponse} from '@oniichan/shared/model';
import type {InboxConfig} from '@oniichan/editor-host/protocol';
import type {AssistantRole} from '@oniichan/shared/inbox';
import type {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import type {ModelAccessHost, ModelChatOptions} from '../../../core/model';
import type {EditorHost} from '../../../core/editor';
import type {InboxMessageThread, InboxRoundtrip} from '../../../inbox';

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

export interface ChatContext {
    role: AssistantRole;
    messages: ChatInputPayload[];
    systemPrompt: string;
    modelName: string | undefined;
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

    async *provideChatStream(): AsyncIterable<ModelResponse> {
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
        };
        yield* this.modelAccess.chatStreaming(options);
    }

    abstract provideAssistantRole(): Promise<AssistantRole>;

    protected abstract provideModelName(): Promise<string | undefined>;

    protected abstract provideSystemPrompt(): Promise<string>;

    protected abstract provideChatMessages(): Promise<ChatInputPayload[]>;
}
