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
import {AcceptEditHandler, RenderDiffViewHandler} from './handlers/diff';

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
    | typeof AcceptEditHandler
>;
