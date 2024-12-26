import {ProtocolOf, Server} from '@otakustay/ipc';
import {Logger} from '@oniichan/shared/logger';
import {EditorHost} from './editor';
import {EchoHandler} from './handlers/echo';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {Context} from './handlers/handler';
import {ScaffoldHandler} from './handlers/scaffold';
import {ModelChatHandler} from './handlers/model';
import {ModelTelemetryHandler} from './handlers/telemetry';
import {
    InboxMarkMessageStatusHandler,
    InboxSendMessageHandler,
    InboxGetThreadListHandler,
    InboxSendMessageRequest,
    InboxMarkMessageStatusRequest,
} from './handlers/inbox';

export {EditorHost, InboxSendMessageRequest, InboxMarkMessageStatusRequest};

export type Protocol = ProtocolOf<
    | typeof EchoHandler
    | typeof SemanticRewriteHandler
    | typeof ScaffoldHandler
    | typeof ModelChatHandler
    | typeof ModelTelemetryHandler
    | typeof InboxSendMessageHandler
    | typeof InboxMarkMessageStatusHandler
    | typeof InboxGetThreadListHandler
>;

export class KernelServer extends Server<Protocol, Context> {
    private readonly editorHost: EditorHost;

    private readonly logger: Logger;

    constructor(editorHost: EditorHost, logger: Logger) {
        super({namespace: '-> kernel'});
        this.editorHost = editorHost;
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
    }
}

export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite';
export type {ScaffoldRequest, ScaffoldResponse} from './handlers/scaffold';
