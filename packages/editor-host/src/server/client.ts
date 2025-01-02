import {Client, Port} from '@otakustay/ipc';
import type {EditorHostProtocol} from './protocol';

export type {DocumentLine, LineDiagnostic} from './handlers/document';
export type {FileEntry, FileEntryType, ReadDirectoryRequest} from './handlers/fs';

export class EditorHostClient extends Client<EditorHostProtocol> {
    constructor(port: Port) {
        super(port, {namespace: '-> host'});
    }
}
