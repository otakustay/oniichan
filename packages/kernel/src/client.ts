import {Client, Port} from '@otakustay/ipc';
import type {KernelProtocol} from './protocol';

export class KernelClient extends Client<KernelProtocol> {
    static readonly namespace = '-> kernel';

    constructor(port: Port) {
        super(port, {namespace: KernelClient.namespace});
    }
}
