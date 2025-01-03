import {getDefaultStore} from 'jotai';
import {ipcAtom} from '../atoms/ipc';
import {editingAtom} from '../atoms/draft';
import {RequestHandler} from '@otakustay/ipc';

export class ComposeNewMessageRequestHandler extends RequestHandler<void, void> {
    static readonly action = 'composeNewMessage';

    // eslint-disable-next-line require-yield
    async *handleRequest(): AsyncIterable<void> {
        const store = getDefaultStore();
        await store.get(ipcAtom);
        store.set(editingAtom, {threadUuid: crypto.randomUUID(), mode: 'new'});
    }
}
