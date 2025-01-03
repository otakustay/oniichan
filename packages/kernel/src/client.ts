import {Client, Port} from '@otakustay/ipc';
import type {KernelProtocol} from './protocol';

export type {InboxSendMessageRequest, InboxMarkMessageStatusRequest} from './handlers/inbox';
export type {SemanticRewriteRequest, SemanticRewriteResponse} from './handlers/semanticRewrite';
export type {ScaffoldRequest, ScaffoldResponse} from './handlers/scaffold';

export class KernelClient extends Client<KernelProtocol> {
    static readonly namespace = '-> kernel';

    constructor(port: Port) {
        super(port, {namespace: KernelClient.namespace});
    }
}
