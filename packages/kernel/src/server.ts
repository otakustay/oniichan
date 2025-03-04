import {ExecutionRequest, Server} from '@otakustay/ipc';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';
import {Context} from './handlers/handler';
import {KernelProtocol} from './protocol';
import {CommandExecutor} from './core/command';
import {EchoHandler} from './handlers/echo';
import {
    InboxSendMessageHandler,
    InboxMarkRoundtripStatusHandler,
    InboxGetThreadListHandler,
    InboxCheckEditHandler,
    InboxCheckRollbackHandler,
    InboxRollbackHandler,
    InboxApproveToolHandler,
} from './handlers/inbox';
import {ModelChatHandler} from './handlers/model';
import {ScaffoldHandler} from './handlers/scaffold';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {ModelTelemetryHandler} from './handlers/telemetry';
import {ExportInboxHandler} from './handlers/debug';
import {ThreadStore} from './inbox';
import {InitializeProjectConfigHandler} from './handlers/config';

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
