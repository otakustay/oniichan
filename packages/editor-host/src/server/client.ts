import {Client} from '@otakustay/ipc';
import type {Port} from '@otakustay/ipc';
import type {EditorHostProtocol} from './protocol';

export class EditorHostClient extends Client<EditorHostProtocol> {
    static readonly containerKey = 'EditorHostClient';

    static readonly namespace = '-> host';

    constructor(port: Port) {
        super(port, {namespace: EditorHostClient.namespace});
    }
}
