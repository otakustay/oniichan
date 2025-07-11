import type {ProtocolOf} from '@otakustay/ipc';
import type {ComposeNewMessageHandler} from './handlers/compose.js';
import type {UpdateThreadListHandler} from './handlers/thread.js';
import type {UpdateWorkspaceStateHandler} from './handlers/workspace.js';

export type WebHostProtocol = ProtocolOf<
    | typeof ComposeNewMessageHandler
    | typeof UpdateThreadListHandler
    | typeof UpdateWorkspaceStateHandler
>;
