import {getDefaultStore} from 'jotai';
import {RequestHandler} from '@otakustay/ipc';
import {MessageThreadData} from '@oniichan/shared/inbox';
import {activeTheadUuidAtom, messageThreadListAtom} from '../atoms/inbox';

export class UpdateThreadListHandler extends RequestHandler<MessageThreadData[], void> {
    static readonly action = 'updateThreadList';

    // eslint-disable-next-line require-yield
    async *handleRequest(list: MessageThreadData[]): AsyncIterable<void> {
        const store = getDefaultStore();
        store.set(messageThreadListAtom, list);
        const active = store.get(activeTheadUuidAtom);
        if (!list.some(v => v.uuid === active)) {
            store.set(activeTheadUuidAtom, null);
        }
    }
}
