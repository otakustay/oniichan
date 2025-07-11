import {Server} from '@otakustay/ipc';
import type {ExecutionRequest} from '@otakustay/ipc';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {Logger} from '@oniichan/shared/logger';
import type {DependencyContainer} from '@oniichan/shared/container';
import type {Context} from './handlers/handler.js';
import type {KernelProtocol} from './protocol.js';
import {CommandExecutor} from './core/command.js';
import {EchoHandler} from './handlers/echo/index.js';
import {
    InboxSendMessageHandler,
    InboxMarkRoundtripStatusHandler,
    InboxGetThreadListHandler,
    InboxCheckEditHandler,
    InboxCheckRollbackHandler,
    InboxRollbackHandler,
    InboxApproveToolHandler,
} from './handlers/inbox/index.js';
import {ModelChatHandler} from './handlers/model/index.js';
import {ScaffoldHandler} from './handlers/scaffold/index.js';
import {SemanticRewriteHandler} from './handlers/semanticRewrite/index.js';
import {ModelTelemetryHandler} from './handlers/telemetry/index.js';
import {ExportInboxHandler} from './handlers/debug/index.js';
import {ThreadStore} from './inbox/index.js';
import {InitializeProjectConfigHandler} from './handlers/config/index.js';

interface Dependency {
    [CommandExecutor.containerKey]: CommandExecutor;
    [EditorHostClient.containerKey]: EditorHostClient;
    [Logger.containerKey]: Logger;
    [ThreadStore.containerKey]: ThreadStore;
}

export class KernelServer extends Server<KernelProtocol, Context> {
    static readonly namespace = '-> kernel';

    private readonly container: DependencyContainer<Dependency>;

    constructor(container: DependencyContainer<Dependency>) {
        super({namespace: KernelServer.namespace});
        this.container = container;
    }

    protected async createContext(request: ExecutionRequest): Promise<Context> {
        const editorHostClient = this.container.get(EditorHostClient).forTask(request.taskId);
        return {
            editorHost: editorHostClient,
            logger: this.container.get(Logger),
            store: this.container.get(ThreadStore),
            commandExecutor: this.container.get(CommandExecutor),
        };
    }

    protected initializeHandlers(): void {
        this.registerHandler(EchoHandler);
        this.registerHandler(SemanticRewriteHandler);
        this.registerHandler(ScaffoldHandler);
        this.registerHandler(ModelChatHandler);
        this.registerHandler(ModelTelemetryHandler);
        this.registerHandler(InboxSendMessageHandler);
        this.registerHandler(InboxMarkRoundtripStatusHandler);
        this.registerHandler(InboxCheckEditHandler);
        this.registerHandler(InboxGetThreadListHandler);
        this.registerHandler(InboxCheckRollbackHandler);
        this.registerHandler(InboxRollbackHandler);
        this.registerHandler(InboxApproveToolHandler);
        this.registerHandler(ExportInboxHandler);
        this.registerHandler(InitializeProjectConfigHandler);
    }
}
