import {Client} from '@otakustay/ipc';
import type {Port} from '@otakustay/ipc';
import type {WebHostProtocol} from './protocol';

export class WebHostClient extends Client<WebHostProtocol> {
    static readonly namespace = '-> web';

    constructor(port: Port) {
        super(port, {namespace: WebHostClient.namespace});
    }
}
