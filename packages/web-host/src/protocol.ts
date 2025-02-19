import type {ProtocolOf} from '@otakustay/ipc';
import type {ComposeNewMessageRequestHandler} from './handlers/compose';
import type {UpdateThreadListHandler} from './handlers/thread';
import type {UpdateWorkspaceStateRequestHandler} from './handlers/workspace';

export type {UpdateWorkspaceStateRequest} from './handlers/workspace';

export type WebHostProtocol = ProtocolOf<
    | typeof ComposeNewMessageRequestHandler
    | typeof UpdateThreadListHandler
    | typeof UpdateWorkspaceStateRequestHandler
>;
