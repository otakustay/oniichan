import {ExtensionContext} from 'vscode';
import {ProtocolOf, Server} from '@otakustay/ipc';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
} from './handlers/document';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '../ui/loading';
import {GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import {Context} from './interface';

export type {DocumentLine, LineDiagnostic} from './handlers/document';

export type Protocol = ProtocolOf<
    | typeof GetDocumentTextHandler
    | typeof GetDocumentLanguageIdHandler
    | typeof GetDocumentDiagnosticAtLineHandler
    | typeof GetModelConfigHandler
    | typeof RequestModelConfigureHandler
>;

export interface HostServerDependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    ExtensionContext: ExtensionContext;
}

export class HostServer extends Server<Protocol, Context> {
    private readonly container: DependencyContainer<HostServerDependency>;

    constructor(container: DependencyContainer<HostServerDependency>) {
        super();
        this.container = container;
    }

    protected initializeHandlers() {
        this.registerHandler(GetDocumentTextHandler);
        this.registerHandler(GetDocumentLanguageIdHandler);
        this.registerHandler(GetDocumentDiagnosticAtLineHandler);
        this.registerHandler(GetModelConfigHandler);
        this.registerHandler(RequestModelConfigureHandler);
    }

    protected async createContext() {
        return {
            loadingManager: this.container.get(LoadingManager),
            logger: this.container.get(Logger),
            extensionHost: this.container.get('ExtensionContext'),
        };
    }
}