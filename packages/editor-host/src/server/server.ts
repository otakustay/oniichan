import type {ExtensionContext} from 'vscode';
import {Server} from '@otakustay/ipc';
import type {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';
import {LoadingManager} from '../ui/loading';
import {DiffViewManager} from '../ui/diff';
import {ResourceManager} from '../utils/resource';
import {TerminalManager} from '../utils/terminal';
import type {Context} from './interface';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document';
import {GetInboxConfigHandler, GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import {CheckFileExistsHandler, CreateDirectoryHandler, ReadDirectoryHandler, ReadFileHandler} from './handlers/fs';
import type {EditorHostProtocol} from './protocol';
import {
    DeleteWorkspaceFileHandler,
    FindFilesHandler,
    GetWorkspaceRootHandler,
    GetWorkspaceStructureHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
} from './handlers/workspace';
import {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff';
import {ExecuteTerminalHandler} from './handlers/terminal';
import {OpenUrlHandler} from './handlers/external';

export interface EditorHostDependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
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
        this.registerHandler(OpenDocumentHandler);
        this.registerHandler(GetModelConfigHandler);
        this.registerHandler(GetInboxConfigHandler);
        this.registerHandler(RequestModelConfigureHandler);
        this.registerHandler(ReadFileHandler);
        this.registerHandler(ReadDirectoryHandler);
        this.registerHandler(CheckFileExistsHandler);
        this.registerHandler(CreateDirectoryHandler);
        this.registerHandler(GetWorkspaceRootHandler);
        this.registerHandler(FindFilesHandler);
        this.registerHandler(GetWorkspaceStructureHandler);
        this.registerHandler(ReadWorkspaceFileHandler);
        this.registerHandler(WriteWorkspaceFileHandler);
        this.registerHandler(DeleteWorkspaceFileHandler);
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
            workspaceStructure: this.container.get(WorkspaceFileStructure),
            logger: this.logger,
            resourceManager: this.resourceManager,
            terminalManager: this.terminalManager,
        };
    }
}
