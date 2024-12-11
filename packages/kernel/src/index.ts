import {ProtocolOf, Server} from '@otakustay/ipc';
import {SemanticRewriteHandler} from './handlers/semanticRewrite';
import {Context} from './handlers/handler';
import {EditorHost} from './host';

export {EditorHost};

export type Protocol = ProtocolOf<typeof SemanticRewriteHandler>;

export class KernelServer extends Server<Protocol, Context> {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        super();
        this.editorHost = editorHost;
    }
    protected async createContext(): Promise<Context> {
        return {editorHost: this.editorHost};
    }

    protected initializeHandlers(): void {
        this.registerHandler(SemanticRewriteHandler);
    }
}

export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite';
