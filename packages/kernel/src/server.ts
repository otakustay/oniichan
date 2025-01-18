import {Server} from '@otakustay/ipc';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {Logger} from '@oniichan/shared/logger';
import {Context} from './handlers/handler';
import {EditorHost} from './editor';
import {KernelProtocol} from './protocol';
import {EchoHandler} from './handlers/echo';
import {
    InboxSendMessageHandler,
    InboxMarkMessageStatusHandler,
    InboxGetThreadListHandler,
    InboxDumpHandler,
} from './handlers/inbox';
import {ModelChatHandler} from './handlers/model';
import {ScaffoldHandler} from './handlers/scaffold';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {ModelTelemetryHandler} from './handlers/telemetry';

export class KernelServer extends Server<KernelProtocol, Context> {
    static readonly namespace = '-> kernel';

    private readonly editorHost: EditorHost;

    private readonly logger: Logger;

    constructor(editorHostClient: EditorHostClient, logger: Logger) {
        super({namespace: KernelServer.namespace});
        this.editorHost = new EditorHost(editorHostClient);
        this.logger = logger;
    }

    protected async createContext(): Promise<Context> {
        return {editorHost: this.editorHost, logger: this.logger};
    }

    protected initializeHandlers(): void {
        this.registerHandler(EchoHandler);
        this.registerHandler(SemanticRewriteHandler);
        this.registerHandler(ScaffoldHandler);
        this.registerHandler(ModelChatHandler);
        this.registerHandler(ModelTelemetryHandler);
        this.registerHandler(InboxSendMessageHandler);
        this.registerHandler(InboxMarkMessageStatusHandler);
        this.registerHandler(InboxGetThreadListHandler);
        this.registerHandler(InboxDumpHandler);
    }
}
