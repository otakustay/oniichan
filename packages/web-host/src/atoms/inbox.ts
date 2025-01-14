import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {InboxSendMessageRequest, InboxMarkMessageStatusRequest} from '@oniichan/kernel/protocol';
import {Message, MessageStatus, MessageThread} from '@oniichan/shared/inbox';
import {MessageToolUsage} from '@oniichan/shared/tool';
import {useIpcValue} from './ipc';
import {useSetDraftContent, useSetEditing} from './draft';

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
    create: () => Message;
    update: (message: Message) => Message;
}

function createThreadListUpdate(threadUuid: string, messageUuid: string, options: MessageUpdateOptions) {
    return (threads: MessageThread[]) => {
        const {create, update} = options;
        const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

        if (threadIndex < 0) {
            return threads;
        }

        const targetThread = threads[threadIndex];
        const messageIndex = targetThread.messages.findIndex(v => v.uuid === messageUuid);

        if (messageIndex < 0) {
            const newMessage = create();
            return [
                ...threads.slice(0, threadIndex),
                {
                    ...targetThread,
                    messages: [
                        newMessage,
                        ...targetThread.messages,
                    ],
                },
                ...threads.slice(threadIndex + 1),
            ];
        }

        const targetMessage = targetThread.messages[messageIndex];
        return [
            ...threads.slice(0, threadIndex),
            {
                ...targetThread,
                messages: [
                    ...targetThread.messages.slice(0, messageIndex),
                    update(targetMessage),
                    ...targetThread.messages.slice(messageIndex + 1),
                ],
            },
            ...threads.slice(threadIndex + 1),
        ];
    };
}

function appendMessageBy(threadUuid: string, messageUuid: string, chunk: string) {
    return createThreadListUpdate(
        threadUuid,
        messageUuid,
        {
            create: () => {
                return {
                    uuid: messageUuid,
                    sender: 'assistant',
                    content: [chunk],
                    status: 'generating',
                    createdAt: now(),
                };
            },
            update: message => {
                if (message.sender === 'assistant') {
                    const lastChunk = message.content.at(-1);
                    if (typeof lastChunk === 'string') {
                        return {
                            ...message,
                            content: [
                                ...message.content.slice(0, -1),
                                lastChunk + chunk,
                            ],
                        };
                    }
                    return {...message, content: [...message.content, chunk]};
                }
                return {
                    ...message,
                    content: message.content + chunk,
                };
            },
        }
    );
}

function addToolUsageBy(threadUuid: string, messageUuid: string, usage: MessageToolUsage) {
    return createThreadListUpdate(
        threadUuid,
        messageUuid,
        {
            create: () => {
                return {
                    uuid: messageUuid,
                    sender: 'assistant',
                    content: [usage],
                    status: 'generating',
                    createdAt: now(),
                };
            },
            update: message => {
                if (message.sender === 'user') {
                    throw new Error('Cannot add tool usage to user message');
                }

                // Kernel will push message containing the latest tool usage,
                // and we also append usage to message here, this may cause duplication of usage items,
                // we need to test if the usage is already exists
                const exists = message.content.some(v => typeof v === 'object' && v.id === usage.id);
                return exists
                    ? message
                    : {
                        ...message,
                        content: [...message.content, usage],
                    };
            },
        }
    );
}

export function useSendMessageToThread(threadUuid: string) {
    const ipc = useIpcValue();
    const setMessageThreadList = useSetMessagelThreadList();
    const setEditing = useSetEditing();
    const setDraftContent = useSetDraftContent();
    return async (uuid: string, content: string) => {
        setEditing(null);
        setDraftContent('');
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
                setMessageThreadList(addToolUsageBy(threadUuid, chunk.uuid, chunk.value));
            }
        }
    };
}
