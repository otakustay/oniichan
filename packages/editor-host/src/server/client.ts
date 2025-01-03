import {Client, Port} from '@otakustay/ipc';
import type {EditorHostProtocol} from './protocol';

export class EditorHostClient extends Client<EditorHostProtocol> {
    static readonly namespace = '-> host';

    constructor(port: Port) {
        super(port, {namespace: EditorHostClient.namespace});
    }
}
