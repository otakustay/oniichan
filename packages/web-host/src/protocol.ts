import type {ProtocolOf} from '@otakustay/ipc';
import type {ComposeNewMessageHandler} from './handlers/compose';
import type {UpdateThreadListHandler} from './handlers/thread';
import type {UpdateWorkspaceStateHandler} from './handlers/workspace';

export type WebHostProtocol = ProtocolOf<
    | typeof ComposeNewMessageHandler
    | typeof UpdateThreadListHandler
    | typeof UpdateWorkspaceStateHandler
>;
