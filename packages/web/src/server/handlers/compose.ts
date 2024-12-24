import {getDefaultStore} from 'jotai';
import {clientAtom} from '@/atoms/client';
import {editingAtom} from '@/atoms/draft';
import {RequestHandler} from '@otakustay/ipc';

export class ComposeNewMessageRequestHandler extends RequestHandler<void, void> {
    static action = 'composeNewMessage' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest(): AsyncIterable<void> {
        const store = getDefaultStore();
        await store.get(clientAtom);
        store.set(editingAtom, {threadUuid: crypto.randomUUID(), mode: 'new'});
    }
}
