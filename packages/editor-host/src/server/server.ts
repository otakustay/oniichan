import {Server} from '@otakustay/ipc';
import type {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';
import {LoadingManager} from '../ui/loading.js';
import {DiffViewManager} from '../ui/diff.js';
import {ResourceManager} from '../utils/resource.js';
import {TerminalManager} from '../utils/terminal/index.js';
import type {Context} from './interface.js';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document.js';
import {GetInboxConfigHandler, GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config.js';
import {CheckFileExistsHandler, CreateDirectoryHandler, ReadDirectoryHandler, ReadFileHandler} from './handlers/fs.js';
import type {EditorHostProtocol} from './protocol.js';
import {
    DeleteWorkspaceFileHandler,
    FindFilesHandler,
    GetWorkspaceRootHandler,
    GetWorkspaceStructureHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
} from './handlers/workspace.js';
import {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff.js';
import {ExecuteTerminalHandler} from './handlers/terminal.js';
import {OpenUrlHandler} from './handlers/external.js';

export interface EditorHostDependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
    [ResourceManager.containerKey]: ResourceManager;
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

        const globalResourceManager = this.container.get(ResourceManager);
        globalResourceManager.addResource(this.resourceManager);
        globalResourceManager.addResource(this.terminalManager);
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
            diffViewManager: this.container.get(DiffViewManager),
            workspaceStructure: this.container.get(WorkspaceFileStructure),
            logger: this.logger,
            resourceManager: this.resourceManager,
            terminalManager: this.terminalManager,
        };
    }
}
