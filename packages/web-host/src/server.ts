import {Server} from '@otakustay/ipc';
import {ComposeNewMessageHandler} from './handlers/compose.js';
import {UpdateThreadListHandler} from './handlers/thread.js';
import type {WebHostProtocol} from './protocol.js';
import {UpdateWorkspaceStateHandler} from './handlers/workspace.js';

export class WebHostServer extends Server<WebHostProtocol> {
    static readonly namespace = '-> web';

    constructor() {
        super({namespace: WebHostServer.namespace});
    }
    protected initializeHandlers() {
        this.registerHandler(ComposeNewMessageHandler);
        this.registerHandler(UpdateThreadListHandler);
        this.registerHandler(UpdateWorkspaceStateHandler);
    }

    protected async createContext() {
        return null;
    }
}
