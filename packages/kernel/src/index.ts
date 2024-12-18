import {ProtocolOf, Server} from '@otakustay/ipc';
import {Logger} from '@oniichan/shared/logger';
import {EditorHost} from './host';
import {EchoHandler} from './handlers/echo';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {Context} from './handlers/handler';
import {ScaffoldHandler} from './handlers/scaffold';

export {EditorHost};

export type Protocol = ProtocolOf<typeof EchoHandler | typeof SemanticRewriteHandler | typeof ScaffoldHandler>;

export class KernelServer extends Server<Protocol, Context> {
    private readonly editorHost: EditorHost;

    private readonly logger: Logger;

    constructor(editorHost: EditorHost, logger: Logger) {
        super();
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
    }
}

export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite';
export type {ScaffoldRequest, ScaffoldResponse} from './handlers/scaffold';
