import {Client} from '@otakustay/ipc';
import type {Port} from '@otakustay/ipc';
import type {EditorHostProtocol} from '@oniichan/editor-host/protocol';

export class EvalEditorHostClient extends Client<EditorHostProtocol> {
    static readonly containerKey = 'EditorHostClient';

    static readonly namespace = '-> host';

    constructor(port: Port) {
        super(port, {namespace: EvalEditorHostClient.namespace});
    }
}
