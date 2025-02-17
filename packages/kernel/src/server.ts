import {Server} from '@otakustay/ipc';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';
import {Context} from './handlers/handler';
import {EditorHost} from './editor';
import {KernelProtocol} from './protocol';
import {CommandExecutor} from './core/command';
import {EchoHandler} from './handlers/echo';
import {InboxSendMessageHandler, InboxMarkRoundtripStatusHandler, InboxGetThreadListHandler} from './handlers/inbox';
import {ModelChatHandler} from './handlers/model';
import {ScaffoldHandler} from './handlers/scaffold';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {ModelTelemetryHandler} from './handlers/telemetry';
import {ExportInboxHandler} from './handlers/debug';

interface Dependency {
    [CommandExecutor.containerKey]: CommandExecutor;
    [EditorHostClient.containerKey]: EditorHostClient;
    [Logger.containerKey]: Logger;
}

export class KernelServer extends Server<KernelProtocol, Context> {
    static readonly namespace = '-> kernel';

    private readonly editorHost: EditorHost;

    private readonly commandExecutor: CommandExecutor;

    private readonly logger: Logger;

    constructor(container: DependencyContainer<Dependency>) {
        super({namespace: KernelServer.namespace});
        this.editorHost = new EditorHost(container.get(EditorHostClient));
        this.commandExecutor = container.get(CommandExecutor);
        this.logger = container.get(Logger);
    }

    protected async createContext(): Promise<Context> {
        return {editorHost: this.editorHost, logger: this.logger, commandExecutor: this.commandExecutor};
    }

    protected initializeHandlers(): void {
        this.registerHandler(EchoHandler);
        this.registerHandler(SemanticRewriteHandler);
        this.registerHandler(ScaffoldHandler);
        this.registerHandler(ModelChatHandler);
        this.registerHandler(ModelTelemetryHandler);
        this.registerHandler(InboxSendMessageHandler);
        this.registerHandler(InboxMarkRoundtripStatusHandler);
        this.registerHandler(InboxGetThreadListHandler);
        this.registerHandler(ExportInboxHandler);
    }
}
