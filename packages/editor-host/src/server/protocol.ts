import type {ProtocolOf} from '@otakustay/ipc';
import type {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
} from './handlers/document';
import type {GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import type {ReadDirectoryHandler, ReadFileHandler} from './handlers/fs';
import type {
    GetWorkspaceRootHandler,
    FindFilesHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
} from './handlers/workspace';
import type {AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff';
import type {ExecuteTerminalHandler} from './handlers/terminal';
import type {OpenUrlHandler} from './handlers/external';

export type {DocumentLine, LineDiagnostic} from './handlers/document';
export type {FileEntry, FileEntryType, ReadDirectoryRequest} from './handlers/fs';
export type {RenderDiffViewRequest, AcceptEditRequest, DiffAction} from './handlers/diff';
export type {WriteWorkspaceFileRequest, FindFilesRequest} from './handlers/workspace';
export type {ExecuteTerminalRequest, ExecuteTerminalResponse} from './handlers/terminal';

export type EditorHostProtocol = ProtocolOf<
    | typeof GetDocumentTextHandler
    | typeof GetDocumentLanguageIdHandler
    | typeof GetDocumentDiagnosticAtLineHandler
    | typeof GetModelConfigHandler
    | typeof RequestModelConfigureHandler
    | typeof ReadFileHandler
    | typeof ReadDirectoryHandler
    | typeof GetWorkspaceRootHandler
    | typeof FindFilesHandler
    | typeof ReadWorkspaceFileHandler
    | typeof WriteWorkspaceFileHandler
    | typeof RenderDiffViewHandler
    | typeof AcceptFileEditHandler
    | typeof ExecuteTerminalHandler
    | typeof OpenUrlHandler
>;
