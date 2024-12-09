import {Server, ProtocolOf} from '@otakustay/ipc';
import {ModelTelemetryHandler} from './handlers/modelTelemetry';

export type Protocol = ProtocolOf<typeof ModelTelemetryHandler>;

export class IpcServer extends Server<Protocol> {
    protected initializeHandlers(): void {
        this.registerHandler(ModelTelemetryHandler);
    }
}
