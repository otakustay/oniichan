import {Server} from '@otakustay/ipc';
import {ComposeNewMessageRequestHandler} from './handlers/compose';
import {UpdateThreadListHandler} from './handlers/thread';
import {WebHostProtocol} from './protocol';

export class WebHostServer extends Server<WebHostProtocol> {
    static readonly namespace = '-> web';

    constructor() {
        super({namespace: WebHostServer.namespace});
    }
    protected initializeHandlers() {
        this.registerHandler(ComposeNewMessageRequestHandler);
        this.registerHandler(UpdateThreadListHandler);
    }

    protected async createContext() {
        return null;
    }
}
