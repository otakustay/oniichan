import type {TaskIdBoundClient} from '@otakustay/ipc';
import type {EditorHostProtocol} from '@oniichan/editor-host/protocol';

export type EditorHost = TaskIdBoundClient<EditorHostProtocol>;
