import {getDefaultStore} from 'jotai';
import {RequestHandler} from '@otakustay/ipc';
import {MessageThread} from '@oniichan/shared/inbox';
import {activeTheadUuidAtom, messageThreadListAtom} from '../atoms/inbox';

export class UpdateThreadListHandler extends RequestHandler<MessageThread[], void> {
    static action = 'updateThreadList' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest(list: MessageThread[]): AsyncIterable<void> {
        const store = getDefaultStore();
        store.set(messageThreadListAtom, list);
        const active = store.get(activeTheadUuidAtom);
        if (!list.some(v => v.uuid === active)) {
            store.set(activeTheadUuidAtom, null);
        }
    }
}
