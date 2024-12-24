import {ProtocolOf, Server as IpcServer} from '@otakustay/ipc';
import {ComposeNewMessageRequestHandler} from './handlers/compose';

export type Protocol = ProtocolOf<typeof ComposeNewMessageRequestHandler>;

export class Server extends IpcServer<Protocol> {
    protected initializeHandlers() {
        super.registerHandler(ComposeNewMessageRequestHandler);
    }

    protected async createContext() {
        return null;
    }
}
