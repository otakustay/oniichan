import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {InboxSendMessageRequest, InboxMarkMessageStatusRequest} from '@oniichan/kernel';
import {Message, MessageReference, MessageStatus, MessageThread} from '@oniichan/shared/inbox';
import {useIpcValue} from './ipc';
import {useSetEditing} from './draft';

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

interface MessageUpdateOptions {
    threadUuid: string;
    messageUuid: string;
    create: () => Message;
    update: (message: Message) => Message;
}

function updateThreadList(threads: MessageThread[], options: MessageUpdateOptions) {
    const {threadUuid, messageUuid, create, update} = options;
    const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

    if (threadIndex < 0) {
        return threads;
    }

    const targetThread = threads[threadIndex];
    const messageIndex = targetThread.messages.findIndex(v => v.uuid === messageUuid);

    if (messageIndex < 0) {
        const newMessage = create();
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
                update(targetMessage),
                ...targetThread.messages.slice(messageIndex + 1),
            ],
        },
        ...threads.slice(0, threadIndex),
        ...threads.slice(threadIndex + 1),
    ];
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
            return updateThreadList(
                threads,
                {
                    threadUuid: threadUuid,
                    messageUuid: messageUuid,
                    create: () => {
                        return {
                            uuid: messageUuid,
                            sender: 'assistant',
                            content: chunk,
                            status: 'generating',
                            references: [],
                            createdAt: now(),
                        };
                    },
                    update: message => {
                        return {
                            ...message,
                            content: message.content + chunk,
                        };
                    },
                }
            );
        };
    };
    const addReferenceBy = (threadUuid: string, messageUuid: string, reference: MessageReference) => {
        return (threads: MessageThread[]) => {
            return updateThreadList(
                threads,
                {
                    threadUuid: threadUuid,
                    messageUuid: messageUuid,
                    create: () => {
                        return {
                            uuid: messageUuid,
                            sender: 'assistant',
                            content: '',
                            status: 'generating',
                            references: [reference],
                            createdAt: now(),
                        };
                    },
                    update: message => {
                        const exists = message.references.find(v => v.id === reference.id);

                        if (exists) {
                            return message;
                        }

                        return {
                            ...message,
                            references: [...message.references, reference],
                        };
                    },
                }
            );
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
            if (chunk.type === 'text') {
                setMessageThreadList(appendMessageBy(threadUuid, chunk.uuid, chunk.value));
            }
            else {
                setMessageThreadList(addReferenceBy(threadUuid, chunk.uuid, chunk.value));
            }
        }
    };
}
