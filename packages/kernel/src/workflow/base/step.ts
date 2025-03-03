import {Logger} from '@oniichan/shared/logger';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {InboxConfig} from '@oniichan/editor-host/protocol';
import {
    createEmptyAssistantTextMessage,
    InboxRoundtrip,
    InboxWorkflowOriginMessage,
    InboxWorkflowSourceMessage,
} from '../../inbox';
import {CommandExecutor} from '../../core/command';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {EditorHost} from '../../core/editor';
import {InboxMessage, InboxMessageThread} from '../../inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';

async function* iterable(content: string): AsyncIterable<string> {
    yield content;
}

export interface StepModelChatOptions {
    includeSystemPrompt: boolean;
    includeBaseMessages: boolean;
}

export interface WorkflowStepInit {
    // context
    taskId: string;
    thread: InboxMessageThread;
    roundtrip: InboxRoundtrip;
    inboxConfig: InboxConfig;
    systemPrompt: string;
    // tool
    commandExecutor: CommandExecutor;
    telemetry: FunctionUsageTelemetry;
    modelAccess: ModelAccessHost;
    editorHost: EditorHost;
    logger: Logger;
    // callback
    onUpdateThread: () => void;
}

export abstract class WorkflowStep {
    protected readonly thread: InboxMessageThread;

    protected readonly roundtrip: InboxRoundtrip;

    protected readonly editorHost: EditorHost;

    protected readonly logger: Logger;

    private readonly telemetry: FunctionUsageTelemetry;

    private readonly taskId: string;

    private readonly systemPrompt: string;

    private readonly modelAccess: ModelAccessHost;

    private readonly onUpdateThread: () => void;

    constructor(init: WorkflowStepInit) {
        this.thread = init.thread;
        this.roundtrip = init.roundtrip;
        this.taskId = init.taskId;
        this.systemPrompt = init.systemPrompt;
        this.telemetry = init.telemetry;
        this.modelAccess = init.modelAccess;
        this.editorHost = init.editorHost;
        this.logger = init.logger.with({source: new.target.name, taskId: this.taskId});
        this.onUpdateThread = init.onUpdateThread;
    }

    protected getWorkflowSourceMessage(): InboxWorkflowSourceMessage | null {
        return this.roundtrip.getLatestTextMessage();
    }

    protected getWorkflowSourceMessageStrict(): InboxWorkflowSourceMessage {
        return this.roundtrip.getLatestTextMessageStrict();
    }

    protected getWorkflowOriginMessage(): InboxWorkflowOriginMessage | null {
        return this.roundtrip.getLatestWorkflow()?.getOriginMessage() ?? null;
    }

    protected getWorkflowOriginMessageStrict(): InboxWorkflowOriginMessage {
        return this.roundtrip.getLatestWorkflowStrict().getOriginMessage();
    }

    protected isInWorkflow(): boolean {
        return !!this.roundtrip.getLatestWorkflow();
    }

    protected async requestNewAssistantTextMessage(message: InboxMessage, options: StepModelChatOptions) {
        const base = options?.includeBaseMessages ? this.getBaseMessages() : [];
        const chatOptions: ModelChatOptions = {
            messages: [...base, message.toChatInputPayload()],
            telemetry: this.telemetry.createModelTelemetry(),
            systemPrompt: options.includeSystemPrompt ? this.systemPrompt : undefined,
        };
        const response = await this.modelAccess.chat(chatOptions);
        return this.parseAssistantText(response.content);
    }

    protected updateThread() {
        this.onUpdateThread();
    }

    private getBaseMessages() {
        const current = this.getWorkflowSourceMessage() ?? this.getWorkflowOriginMessage();
        const messages = this.thread.toMessages();
        return messages.filter(v => v !== current).map(v => v.toChatInputPayload());
    }
    private async parseAssistantText(content: string) {
        const parser = new StreamingToolParser();
        const message = createEmptyAssistantTextMessage(this.roundtrip);
        for await (const chunk of parser.parse(iterable(content))) {
            message.addChunk(chunk);
        }
        return message;
    }
}
