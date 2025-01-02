import {Server} from '@otakustay/ipc';
import {ComposeNewMessageRequestHandler} from './handlers/compose';
import {UpdateThreadListHandler} from './handlers/thread';
import {WebHostProtocol} from './protocol';

export class WebHostServer extends Server<WebHostProtocol> {
    constructor() {
        super({namespace: '-> web'});
    }
    protected initializeHandlers() {
        this.registerHandler(ComposeNewMessageRequestHandler);
        this.registerHandler(UpdateThreadListHandler);
    }

    protected async createContext() {
        return null;
    }
}
