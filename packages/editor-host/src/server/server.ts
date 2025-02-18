import {ExtensionContext} from 'vscode';
import {Server} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '../ui/loading';
import {DiffViewManager} from '../ui/diff';
import {Context} from './interface';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
} from './handlers/document';
import {GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import {ReadDirectoryHandler, ReadFileHandler} from './handlers/fs';
import {EditorHostProtocol} from './protocol';
import {
    FindFilesHandler,
    GetWorkspaceRootHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
} from './handlers/workspace';
import {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff';
import {ResourceManager} from '../utils/resource';
import {TerminalManager} from '../utils/terminal';
import {ExecuteTerminalHandler} from './handlers/terminal';
import {OpenUrlHandler} from './handlers/external';

export interface EditorHostDependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    ExtensionContext: ExtensionContext;
}

export class EditorHostServer extends Server<EditorHostProtocol, Context> {
    static readonly containerKey = 'EditorHostServer';

    static readonly namespace = '-> host';

    private readonly container: DependencyContainer<EditorHostDependency>;

    private readonly resourceManager;

    private readonly terminalManager;

    private readonly logger: Logger;

    constructor(container: DependencyContainer<EditorHostDependency>) {
        super({namespace: EditorHostServer.namespace});
        this.container = container;
        this.resourceManager = new ResourceManager(container);
        this.terminalManager = new TerminalManager(container);
        this.logger = this.container.get(Logger).with({source: 'EditorHostServer'});

        const extensionContext = this.container.get('ExtensionContext');
        extensionContext.subscriptions.push(this.resourceManager);
        extensionContext.subscriptions.push(this.terminalManager);
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
        this.registerHandler(ReadWorkspaceFileHandler);
        this.registerHandler(WriteWorkspaceFileHandler);
        this.registerHandler(CheckEditAppliableHandler);
        this.registerHandler(RenderDiffViewHandler);
        this.registerHandler(AcceptFileEditHandler);
        this.registerHandler(ExecuteTerminalHandler);
        this.registerHandler(OpenUrlHandler);
    }

    protected async createContext() {
        return {
            loadingManager: this.container.get(LoadingManager),
            extensionHost: this.container.get('ExtensionContext'),
            diffViewManager: this.container.get(DiffViewManager),
            logger: this.logger,
            resourceManager: this.resourceManager,
            terminalManager: this.terminalManager,
        };
    }
}
