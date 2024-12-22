import {Server, ProtocolOf} from '@otakustay/ipc';
import {ModelTelemetryHandler} from './handlers/modelTelemetry';
import {ModelChatHandler} from './handlers/model';

export type Protocol = ProtocolOf<typeof ModelTelemetryHandler | typeof ModelChatHandler>;

export class IpcServer extends Server<Protocol> {
    protected initializeHandlers(): void {
        this.registerHandler(ModelTelemetryHandler);
        this.registerHandler(ModelChatHandler);
    }

    protected async createContext() {
        return null;
    }
}
