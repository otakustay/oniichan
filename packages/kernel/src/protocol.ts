import type {ProtocolOf} from '@otakustay/ipc';
import type {EchoHandler} from './handlers/echo/index.js';
import type {SemanticRewriteHandler} from './handlers/semanticRewrite/index.js';
import type {ScaffoldHandler} from './handlers/scaffold/index.js';
import type {ModelChatHandler} from './handlers/model/index.js';
import type {ModelTelemetryHandler} from './handlers/telemetry/index.js';
import type {
    InboxSendMessageHandler,
    InboxMarkRoundtripStatusHandler,
    InboxGetThreadListHandler,
    InboxCheckEditHandler,
    InboxCheckRollbackHandler,
    InboxRollbackHandler,
    InboxApproveToolHandler,
} from './handlers/inbox/index.js';
import type {ExportInboxHandler} from './handlers/debug/index.js';
import type {InitializeProjectConfigHandler} from './handlers/config/index.js';

export type {
    InboxSendMessageRequest,
    InboxMarkRoundtripStatusRequest,
    InboxCheckEditResponse,
    InboxRollbackCheckItem,
    InboxMessageIdentity,
    InboxMessageResponse,
    InboxRoundtripIdentity,
    InboxApproveToolRequest,
    InboxCheckRollbackResponse,
    InboxMessageReference,
} from './handlers/inbox/index.js';
export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite/index.js';
export type {ScaffoldRequest, ScaffoldResponse} from './handlers/scaffold/index.js';

export type KernelProtocol = ProtocolOf<
    | typeof EchoHandler
    | typeof SemanticRewriteHandler
    | typeof ScaffoldHandler
    | typeof ModelChatHandler
    | typeof ModelTelemetryHandler
    | typeof InboxSendMessageHandler
    | typeof InboxMarkRoundtripStatusHandler
    | typeof InboxCheckEditHandler
    | typeof InboxGetThreadListHandler
    | typeof InboxCheckRollbackHandler
    | typeof InboxRollbackHandler
    | typeof InboxApproveToolHandler
    | typeof ExportInboxHandler
    | typeof InitializeProjectConfigHandler
>;
