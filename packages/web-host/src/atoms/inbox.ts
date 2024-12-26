import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {InboxSendMessageRequest, InboxMarkMessageStatusRequest} from '@oniichan/kernel';
import {useIpcValue} from './ipc';
import {useSetEditing} from './draft';

export type MessageStatus = 'generating' | 'unread' | 'read';

export interface Message {
    uuid: string;
    sender: 'user' | 'assistant';
    content: string;
    createdAt: string;
    status: MessageStatus;
    error?: string;
}

export interface MessageThread {
    uuid: string;
    messages: Message[];
}

export const messageThreadListAtom = atom<MessageThread[]>([]);

export const activeTheadUuidAtom = atom<string | null>(null);

export function useSetActiveMessageThread() {
    return useSetAtom(activeTheadUuidAtom);
}

export function useExitActiveMessageThread() {
    const set = useSetActiveMessageThread();
    return () => set(null);
}

export function useMessageThreadListValue() {
    return useAtomValue(messageThreadListAtom);
}

export function useMessageThreadValueByUuid(uuid: string) {
    const threads = useMessageThreadListValue();
    return threads.find(v => v.uuid === uuid) ?? null;
}

export function useActiveMessageThreadValue() {
    const uuid = useAtomValue(activeTheadUuidAtom);
    const threads = useMessageThreadListValue();
    return uuid ? threads.find(v => v.uuid === uuid) : null;
}

export function useMarkMessageStatus(threadUuid: string, uuid: string) {
    const ipc = useIpcValue();

    return (status: MessageStatus) => {
        const request: InboxMarkMessageStatusRequest = {threadUuid, uuid, status};
        void ipc.kernel.call(crypto.randomUUID(), 'inboxMarkMessageStatus', request).then(() => {});
    };
}

export function useSetMessagelThreadList() {
    return useSetAtom(messageThreadListAtom);
}

export function useSendMessageToThread(threadUuid: string) {
    const ipc = useIpcValue();
    const setMessageThreadList = useSetMessagelThreadList();
    const setEditing = useSetEditing();
    //     return (threads: MessageThread[]) => {
    //         const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

    //         if (threadIndex < 0) {
    //             const newThread: MessageThread = {
    //                 uuid: threadUuid,
    //                 messages: [message],
    //             };
    //             return [newThread, ...threads];
    //         }

    //         const targetThread = threads[threadIndex];
    //         return [
    //             {
    //                 ...targetThread,
    //                 messages: [message, ...targetThread.messages],
    //             },
    //             ...threads.slice(0, threadIndex),
    //             ...threads.slice(threadIndex + 1),
    //         ];
    //     };
    // };
    const appendMessageBy = (threadUuid: string, messageUuid: string, chunk: string) => {
        return (threads: MessageThread[]) => {
            const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

            if (threadIndex < 0) {
                return threads;
            }

            const targetThread = threads[threadIndex];
            const messageIndex = targetThread.messages.findIndex(v => v.uuid === messageUuid);

            if (messageIndex < 0) {
                const newMessage: Message = {
                    uuid: messageUuid,
                    sender: 'assistant',
                    content: chunk,
                    status: 'generating',
                    createdAt: now(),
                };
                return [
                    {
                        ...targetThread,
                        messages: [
                            newMessage,
                            ...targetThread.messages,
                        ],
                    },
                    ...threads.slice(0, threadIndex),
                    ...threads.slice(threadIndex + 1),
                ];
            }

            const targetMessage = targetThread.messages[messageIndex];
            return [
                {
                    ...targetThread,
                    messages: [
                        ...targetThread.messages.slice(0, messageIndex),
                        {...targetMessage, content: targetMessage.content + chunk},
                        ...targetThread.messages.slice(messageIndex + 1),
                    ],
                },
                ...threads.slice(0, threadIndex),
                ...threads.slice(threadIndex + 1),
            ];
        };
    };
    return async (uuid: string, content: string) => {
        setEditing(null);
        const request: InboxSendMessageRequest = {
            threadUuid: threadUuid,
            uuid: uuid,
            body: {
                type: 'text',
                content: content,
            },
        };
        for await (const chunk of ipc.kernel.callStreaming(uuid, 'inboxSendMessage', request)) {
            setMessageThreadList(appendMessageBy(threadUuid, chunk.uuid, chunk.content));
        }
    };
}
