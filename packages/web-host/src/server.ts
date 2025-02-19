import {Server} from '@otakustay/ipc';
import {ComposeNewMessageRequestHandler} from './handlers/compose';
import {UpdateThreadListHandler} from './handlers/thread';
import {WebHostProtocol} from './protocol';
import {UpdateWorkspaceStateRequestHandler} from './handlers/workspace';

export class WebHostServer extends Server<WebHostProtocol> {
    static readonly namespace = '-> web';

    constructor() {
        super({namespace: WebHostServer.namespace});
    }
    protected initializeHandlers() {
        this.registerHandler(ComposeNewMessageRequestHandler);
        this.registerHandler(UpdateThreadListHandler);
        this.registerHandler(UpdateWorkspaceStateRequestHandler);
    }

    protected async createContext() {
        return null;
    }
}
