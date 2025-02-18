import type {ProtocolOf} from '@otakustay/ipc';
import type {EchoHandler} from './handlers/echo';
import type {SemanticRewriteHandler} from './handlers/semanticRewrite';
import type {ScaffoldHandler} from './handlers/scaffold';
import type {ModelChatHandler} from './handlers/model';
import type {ModelTelemetryHandler} from './handlers/telemetry';
import type {
    InboxSendMessageHandler,
    InboxMarkRoundtripStatusHandler,
    InboxGetThreadListHandler,
    InboxCheckEditHandler,
} from './handlers/inbox';
import type {ExportInboxHandler} from './handlers/debug';

export type {InboxSendMessageRequest, InboxMarkRoundtripStatusRequest} from './handlers/inbox';
export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite';
export type {ScaffoldRequest, ScaffoldResponse} from './handlers/scaffold';

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
    | typeof ExportInboxHandler
>;
