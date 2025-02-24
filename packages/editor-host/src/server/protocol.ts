import type {ProtocolOf} from '@otakustay/ipc';
import type {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document';
import type {GetModelConfigHandler, GetInboxConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import type {
    ReadDirectoryHandler,
    ReadFileHandler,
    CheckFileExistsHandler,
    CreateDirectoryHandler,
} from './handlers/fs';
import type {
    GetWorkspaceRootHandler,
    FindFilesHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
    DeleteWorkspaceFileHandler,
    GetWorkspaceStructureHandler,
} from './handlers/workspace';
import type {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff';
import type {ExecuteTerminalHandler} from './handlers/terminal';
import type {OpenUrlHandler} from './handlers/external';

export type {DocumentLine, LineDiagnostic} from './handlers/document';
export type {FileEntry, FileEntryType, ReadDirectoryRequest} from './handlers/fs';
export type {WriteWorkspaceFileRequest, FindFilesRequest} from './handlers/workspace';
export type {AppliableState} from './handlers/diff';
export type {InboxConfig} from './handlers/config';
export type {ExecuteTerminalRequest, ExecuteTerminalResponse} from './handlers/terminal';

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
