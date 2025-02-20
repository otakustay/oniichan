import {TaskIdBoundClient} from '@otakustay/ipc';
import {EditorHostProtocol} from '@oniichan/editor-host/protocol';

export type EditorHost = TaskIdBoundClient<EditorHostProtocol>;
