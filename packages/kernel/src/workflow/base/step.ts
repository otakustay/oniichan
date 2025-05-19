import type {Logger} from '@oniichan/shared/logger';
import type {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import type {InboxConfig} from '@oniichan/editor-host/protocol';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {createEmptyAssistantTextMessage} from '../../inbox';
import type {CommandExecutor} from '../../core/command';
import type {ModelAccessHost} from '../../core/model';
import type {ModelChatOptions} from '../../core/model';
import type {EditorHost} from '../../core/editor';
import type {
    InboxMessage,
    InboxMessageThread,
    InboxRoundtrip,
    InboxWorkflowOriginMessage,
    InboxWorkflowSourceMessage,
    ChatRole,
} from '../../inbox';

async function* iterable(content: string): AsyncIterable<string> {
    yield content;
}

export interface WorkflowStepInit {
    // context
    taskId: string;
    thread: InboxMessageThread;
    roundtrip: InboxRoundtrip;
    inboxConfig: InboxConfig;
    role: ChatRole;
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

    protected readonly role: ChatRole;

    protected readonly editorHost: EditorHost;

    protected readonly logger: Logger;

    protected readonly commandExecutor: CommandExecutor;

    protected readonly inboxConfig: InboxConfig;

    private readonly telemetry: FunctionUsageTelemetry;

    private readonly taskId: string;

    private readonly modelAccess: ModelAccessHost;

    private readonly onUpdateThread: () => void;

    constructor(init: WorkflowStepInit) {
        this.thread = init.thread;
        this.roundtrip = init.roundtrip;
        this.role = init.role;
        this.taskId = init.taskId;
        this.telemetry = init.telemetry;
        this.modelAccess = init.modelAccess;
        this.editorHost = init.editorHost;
        this.commandExecutor = init.commandExecutor;
        this.inboxConfig = init.inboxConfig;
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

    protected async requestNewAssistantTextMessage(message: InboxMessage) {
        const chatOptions: ModelChatOptions = {
            messages: [message.toChatInputPayload()],
            telemetry: this.telemetry.createModelTelemetry(),
        };
        const response = await this.modelAccess.chat(chatOptions);
        return this.parseAssistantText(response.content);
    }

    protected updateThread() {
        this.onUpdateThread();
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
