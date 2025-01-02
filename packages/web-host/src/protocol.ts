import type {ProtocolOf} from '@otakustay/ipc';
import type {ComposeNewMessageRequestHandler} from './handlers/compose';
import type {UpdateThreadListHandler} from './handlers/thread';

export type WebHostProtocol = ProtocolOf<typeof ComposeNewMessageRequestHandler | typeof UpdateThreadListHandler>;
