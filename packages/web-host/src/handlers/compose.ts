import {getDefaultStore} from 'jotai';
import {ipcAtom} from '../atoms/ipc';
import {editingAtom} from '../atoms/draft';
import {RequestHandler} from '@otakustay/ipc';

export class ComposeNewMessageHandler extends RequestHandler<void, void> {
    static readonly action = 'composeNewMessage';

    // eslint-disable-next-line require-yield
    async *handleRequest(): AsyncIterable<void> {
        const store = getDefaultStore();
        // We must ensure ipc is ready for future logic
        await store.get(ipcAtom);
        store.set(editingAtom, {threadUuid: crypto.randomUUID(), mode: 'new'});
    }
}
