import {ExtensionContext} from 'vscode';
import {Server} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '../ui/loading';
import {Context} from './interface';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
} from './handlers/document';
import {GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import {ReadDirectoryHandler, ReadFileHandler} from './handlers/fs';
import {EditorHostProtocol} from './protocol';
import {FindFilesHandler, GetWorkspaceRootHandler} from './handlers/workspace';

export interface EditorHostDependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    ExtensionContext: ExtensionContext;
}

export class EditorHostServer extends Server<EditorHostProtocol, Context> {
    private readonly container: DependencyContainer<EditorHostDependency>;

    constructor(container: DependencyContainer<EditorHostDependency>) {
        super({namespace: '-> host'});
        this.container = container;
    }

    protected initializeHandlers() {
        this.registerHandler(GetDocumentTextHandler);
        this.registerHandler(GetDocumentLanguageIdHandler);
        this.registerHandler(GetDocumentDiagnosticAtLineHandler);
        this.registerHandler(GetModelConfigHandler);
        this.registerHandler(RequestModelConfigureHandler);
        this.registerHandler(ReadFileHandler);
        this.registerHandler(ReadDirectoryHandler);
        this.registerHandler(GetWorkspaceRootHandler);
        this.registerHandler(FindFilesHandler);
    }

    protected async createContext() {
        return {
            loadingManager: this.container.get(LoadingManager),
            logger: this.container.get(Logger),
            extensionHost: this.container.get('ExtensionContext'),
        };
    }
}
