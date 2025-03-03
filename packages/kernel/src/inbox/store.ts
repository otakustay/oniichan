import {MessageThreadPersistData, MessageThreadData} from '@oniichan/shared/inbox';
import {MessageThread} from './thread';
import {InboxMessageThread} from './interface';

export class ThreadStore {
    static readonly containerKey = 'ThreadStore';

    private threads: InboxMessageThread[];

    constructor(initialThreads: MessageThreadPersistData[] = []) {
        this.threads = initialThreads.map(v => MessageThread.from(v));
    }

    ensureThread(threadUuid: string) {
        const thread = this.threads.find(v => v.uuid === threadUuid);

        if (thread) {
            return thread;
        }

        const newThread = new MessageThread(threadUuid);
        this.threads.unshift(newThread);
        return newThread;
    }

    moveThreadToTop(threadUuid: string) {
        const targetThreadIndex = this.threads.findIndex(v => v.uuid === threadUuid);
        if (targetThreadIndex >= 0) {
            const targetThread = this.threads[targetThreadIndex];
            this.threads.splice(targetThreadIndex, 1);
            this.threads.unshift(targetThread);
        }
    }

    findThreadByUuidStrict(threadUuid: string) {
        const thread = this.threads.find(v => v.uuid === threadUuid);

        if (thread) {
            return thread;
        }

        throw new Error(`Thread ${threadUuid} not found`);
    }

    dump(): MessageThreadData[] {
        const data = this.threads.map(v => v.toThreadData());
        return data;
    }

    persist(): MessageThreadPersistData[] {
        const data = this.threads.map(v => v.toPersistData());
        return data;
    }
}
