import type {ProtocolOf} from '@otakustay/ipc';
import type {
    GetDocumentDiagnosticAtLineHandler,
    GetDocumentLanguageIdHandler,
    GetDocumentTextHandler,
    OpenDocumentHandler,
} from './handlers/document';
import type {GetModelConfigHandler, RequestModelConfigureHandler} from './handlers/config';
import type {ReadDirectoryHandler, ReadFileHandler, CheckFileExistsHandler} from './handlers/fs';
import type {
    GetWorkspaceRootHandler,
    FindFilesHandler,
    ReadWorkspaceFileHandler,
    WriteWorkspaceFileHandler,
} from './handlers/workspace';
import type {CheckEditAppliableHandler, AcceptFileEditHandler, RenderDiffViewHandler} from './handlers/diff';
import type {ExecuteTerminalHandler} from './handlers/terminal';
import type {OpenUrlHandler} from './handlers/external';

export type {DocumentLine, LineDiagnostic} from './handlers/document';
export type {FileEntry, FileEntryType, ReadDirectoryRequest} from './handlers/fs';
export type {WriteWorkspaceFileRequest, FindFilesRequest} from './handlers/workspace';
export type {AppliableState} from './handlers/diff';
export type {ExecuteTerminalRequest, ExecuteTerminalResponse} from './handlers/terminal';

export type EditorHostProtocol = ProtocolOf<
    | typeof GetDocumentTextHandler
    | typeof GetDocumentLanguageIdHandler
    | typeof GetDocumentDiagnosticAtLineHandler
    | typeof OpenDocumentHandler
    | typeof GetModelConfigHandler
    | typeof RequestModelConfigureHandler
    | typeof ReadFileHandler
    | typeof ReadDirectoryHandler
    | typeof CheckFileExistsHandler
    | typeof GetWorkspaceRootHandler
    | typeof FindFilesHandler
    | typeof ReadWorkspaceFileHandler
    | typeof WriteWorkspaceFileHandler
    | typeof CheckEditAppliableHandler
    | typeof RenderDiffViewHandler
    | typeof AcceptFileEditHandler
    | typeof ExecuteTerminalHandler
    | typeof OpenUrlHandler
>;
