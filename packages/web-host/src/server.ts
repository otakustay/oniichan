import {ProtocolOf, Server as IpcServer} from '@otakustay/ipc';
import {ComposeNewMessageRequestHandler} from './handlers/compose';
import {UpdateThreadListHandler} from './handlers/thread';

export type Protocol = ProtocolOf<typeof ComposeNewMessageRequestHandler | typeof UpdateThreadListHandler>;

export class Server extends IpcServer<Protocol> {
    protected initializeHandlers() {
        this.registerHandler(ComposeNewMessageRequestHandler);
        this.registerHandler(UpdateThreadListHandler);
    }

    protected async createContext() {
        return null;
    }
}
