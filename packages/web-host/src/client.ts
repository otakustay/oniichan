import {Client, Port} from '@otakustay/ipc';
import type {WebHostProtocol} from './protocol';

export class WebHostClient extends Client<WebHostProtocol> {
    constructor(port: Port) {
        super(port, {namespace: '-> web'});
    }
}
