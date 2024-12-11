import {ProtocolOf, Server} from '@otakustay/ipc';
import {GetDocumentDiagnosticAtLineHandler, GetDocumentLanguageIdHandler, GetDocumentTextHandler} from './document';
import {GetModelConfigHandler, RequestModelConfigureHandler} from './config';

export type {DocumentLine, LineDiagnostic} from './document';

export type Protocol = ProtocolOf<
    | typeof GetDocumentTextHandler
    | typeof GetDocumentLanguageIdHandler
    | typeof GetDocumentDiagnosticAtLineHandler
    | typeof GetModelConfigHandler
    | typeof RequestModelConfigureHandler
>;

export class HostServer extends Server<Protocol> {
    protected initializeHandlers() {
        this.registerHandler(GetDocumentTextHandler);
        this.registerHandler(GetDocumentLanguageIdHandler);
        this.registerHandler(GetDocumentDiagnosticAtLineHandler);
        this.registerHandler(GetModelConfigHandler);
        this.registerHandler(RequestModelConfigureHandler);
    }

    protected async createContext() {
        return null;
    }
}
