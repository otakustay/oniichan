import {Server} from '@otakustay/ipc';
import {ComposeNewMessageHandler} from './handlers/compose';
import {UpdateThreadListHandler} from './handlers/thread';
import type {WebHostProtocol} from './protocol';
import {UpdateWorkspaceStateHandler} from './handlers/workspace';

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
