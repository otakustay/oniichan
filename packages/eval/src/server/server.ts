import {Server} from '@otakustay/ipc';
import type {Logger} from '@oniichan/shared/logger';
import type {EditorHostProtocol} from '@oniichan/editor-host/protocol';
import type {Context, EvalConfig} from './interface';
import {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document';
import {GetInboxConfigHandler, GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import {CheckFileExistsHandler, CreateDirectoryHandler, ReadDirectoryHandler, ReadFileHandler} from './handlers/fs';
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

export interface EvalEditorHostInit {
    cwd: string;
    logger: Logger;
    config: EvalConfig;
}

export class EvalEditorHostServer extends Server<EditorHostProtocol, Context> {
    static readonly containerKey = 'EditorHostServer';

    static readonly namespace = '-> host';

    private readonly cwd: string;

    private readonly logger: Logger;

    private readonly config: EvalConfig;

    constructor(init: EvalEditorHostInit) {
        super({namespace: EvalEditorHostServer.namespace});
        this.cwd = init.cwd;
        this.logger = init.logger.with({source: 'EvalEditorHostServer'});
        this.config = init.config;
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
            cwd: this.cwd,
            logger: this.logger,
            config: this.config,
        };
    }
}
