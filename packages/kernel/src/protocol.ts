import type {ProtocolOf} from '@otakustay/ipc';
import type {EchoHandler} from './handlers/echo';
import type {SemanticRewriteHandler} from './handlers/semanticRewrite';
import type {ScaffoldHandler} from './handlers/scaffold';
import type {ModelChatHandler} from './handlers/model';
import type {ModelTelemetryHandler} from './handlers/telemetry';
import type {InboxMarkMessageStatusHandler, InboxSendMessageHandler, InboxGetThreadListHandler} from './handlers/inbox';

export type KernelProtocol = ProtocolOf<
    | typeof EchoHandler
    | typeof SemanticRewriteHandler
    | typeof ScaffoldHandler
    | typeof ModelChatHandler
    | typeof ModelTelemetryHandler
    | typeof InboxSendMessageHandler
    | typeof InboxMarkMessageStatusHandler
    | typeof InboxGetThreadListHandler
>;
