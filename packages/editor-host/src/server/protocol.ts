import type {ProtocolOf} from '@otakustay/ipc';
import type {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document.js';
import type {GetModelConfigHandler, GetInboxConfigHandler, RequestModelConfigureHandler} from './handlers/config.js';
import type {
    ReadDirectoryHandler,
    ReadFileHandler,
    CheckFileExistsHandler,
    CreateDirectoryHandler,
} from './handlers/fs.js';
import type {
    GetWorkspaceRootHandler,
    FindFilesHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
    DeleteWorkspaceFileHandler,
    GetWorkspaceStructureHandler,
} from './handlers/workspace.js';
import type {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff.js';
import type {ExecuteTerminalHandler} from './handlers/terminal.js';
import type {OpenUrlHandler} from './handlers/external.js';

export type {DocumentLine, LineDiagnostic} from './handlers/document.js';
export type {FileEntry, FileEntryType, ReadDirectoryRequest} from './handlers/fs.js';
export type {WriteWorkspaceFileRequest, FindFilesRequest} from './handlers/workspace.js';
export type {AppliableState, AcceptFileEditRequest} from './handlers/diff.js';
export type {InboxConfig} from './handlers/config.js';
export type {ExecuteTerminalRequest, ExecuteTerminalResponse} from './handlers/terminal.js';
export type {ExecuteStatus} from '../utils/terminal/index.js';

export type EditorHostProtocol = ProtocolOf<
    | typeof GetDocumentTextHandler
    | typeof GetDocumentLanguageIdHandler
    | typeof GetDocumentDiagnosticAtLineHandler
    | typeof OpenDocumentHandler
    | typeof GetModelConfigHandler
    | typeof GetInboxConfigHandler
    | typeof RequestModelConfigureHandler
    | typeof ReadFileHandler
    | typeof ReadDirectoryHandler
    | typeof CheckFileExistsHandler
    | typeof CreateDirectoryHandler
    | typeof GetWorkspaceRootHandler
    | typeof FindFilesHandler
    | typeof GetWorkspaceStructureHandler
    | typeof ReadWorkspaceFileHandler
    | typeof WriteWorkspaceFileHandler
    | typeof DeleteWorkspaceFileHandler
    | typeof CheckEditAppliableHandler
    | typeof RenderDiffViewHandler
    | typeof AcceptFileEditHandler
    | typeof ExecuteTerminalHandler
    | typeof OpenUrlHandler
>;
