import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {ChatMessagePayload} from '@oniichan/shared/model';
import {useClientValue} from './client';
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

const messageThreadFixtures: MessageThread[] = [
    {
        uuid: '2f773372-aa66-4b9f-a17c-b8c5f57a1fc5',
        messages: [
            {
                uuid: 'f38abde6-d527-4141-8e30-e42bc291a0d0',
                sender: 'assistant',
                content:
                    'Here\'s a bubble sort implementation in TypeScript:\n\n```typescript\nfunction bubbleSort<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    // Create a copy of the array to avoid modifying the original\n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        \n        // Loop through the array\n        for (let i = 0; i < len - 1; i++) {\n            // Compare adjacent elements\n            if (sortedArr[i] > sortedArr[i + 1]) {\n                // Swap elements if they are in wrong order\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped); // Continue until no swaps are needed\n    \n    return sortedArr;\n}\n\n// Example usage:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconsole.log("Original array:", numbers);\nconsole.log("Sorted array:", bubbleSort(numbers));\n\nconst strings = ["banana", "apple", "cherry", "date"];\nconsole.log("Original array:", strings);\nconsole.log("Sorted array:", bubbleSort(strings));\n```\n\nThis implementation includes several TypeScript-specific features:\n\n1. Generic type parameter `<T>` allows the function to work with arrays of any type that can be compared\n2. Type annotations for the parameters and return value\n3. Creates a copy of the input array to maintain immutability\n\nThe bubble sort algorithm works by:\n\n1. Repeatedly stepping through the array\n2. Comparing adjacent elements\n3. Swapping them if they are in the wrong order\n4. Continuing until no swaps are needed (array is sorted)\n\nYou can also create a version that sorts in descending order by simply changing the comparison operator:\n\n```typescript\nfunction bubbleSortDescending<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (sortedArr[i] < sortedArr[i + 1]) { // Changed comparison operator\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n```\n\nIf you want to make it more flexible, you can add a custom comparison function:\n\n```typescript\nfunction bubbleSortWithComparator<T>(\n    arr: T[], \n    comparator: (a: T, b: T) => number\n): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (comparator(sortedArr[i], sortedArr[i + 1]) > 0) {\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n\n// Example usage with custom comparator:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconst descendingSort = bubbleSortWithComparator(numbers, (a, b) => b - a);\nconsole.log("Sorted in descending order:", descendingSort);\n```\n\nThis implementation provides type safety and flexibility while maintaining the classic bubble sort algorithm\'s simplicity.',
                createdAt: '2024-12-21T08:45:28.013Z',
                status: 'unread',
            },
            {
                uuid: 'adc7531d-fe47-49a3-9e8b-cfdfa8aac443',
                sender: 'user',
                createdAt: '2024-12-21T08:45:13.339Z',
                content: 'I\'d love to have a bubble sort written in TypeScript',
                status: 'read',
            },
        ],
    },
    {
        uuid: '9fba22e4-1e3a-4ffa-8502-c956ac0cfce2',
        messages: [
            {
                uuid: 'af437c16-c183-43fc-8f00-3dfabba7b2d7',
                sender: 'assistant',
                content:
                    'I don\'t have access to real-time information, including the current time. I cannot tell you the exact time right now. To check the current time, you can:\n\n1. Look at your device\'s clock\n2. Check your watch\n3. Use an online time service\n4. Ask your device\'s virtual assistant (Siri, Google Assistant, etc.)',
                createdAt: '2021-07-30T06:58:49.335Z',
                status: 'generating',
            },
            {
                uuid: '09ebe07d-61dc-4981-b2cb-6eb1f8d6ffb0',
                sender: 'user',
                content: 'Do you have information about the exact time now?',
                createdAt: '2021-07-30T06:58:49.335Z',
                status: 'read',
            },
        ],
    },
    {
        uuid: '22f20fec-b23d-494b-a172-28e748805aeb',
        messages: [
            {
                uuid: 'b52a5cc5-b3ca-4ee3-a15e-2bf65f30793a',
                sender: 'assistant',
                content:
                    'I\'m Claude, an AI assistant created by Anthropic. I aim to be direct and honest in my communications, including about being an AI. I\'m curious - what made you interested in learning more about me?',
                createdAt: '2021-07-30T06:58:49.335Z',
                status: 'read',
            },
            {
                uuid: '3f8b94da-904b-471e-afaf-8d48e1e0d22d',
                sender: 'user',
                content: 'Who are you?',
                createdAt: '2021-07-30T06:58:49.335Z',
                status: 'read',
            },
        ],
    },
];

const messageThreadListAtom = atom<MessageThread[]>(messageThreadFixtures);

const activeTheadUuidAtom = atom<string | null>(null);

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

export function useMarkMessageStatus(threadUuid: string, messageUuid: string) {
    const setMessageThreadList = useSetMessagelThreadList();
    const markStatusBy = (threadUuid: string, messageUuid: string, status: MessageStatus) => {
        return (threads: MessageThread[]) => {
            const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

            if (threadIndex < 0) {
                return threads;
            }

            const targetThread = threads[threadIndex];
            const messageIndex = targetThread.messages.findIndex(v => v.uuid === messageUuid);

            if (messageIndex < 0) {
                return threads;
            }

            const targetMessage = targetThread.messages[messageIndex];
            return [
                ...threads.slice(0, threadIndex),
                {
                    ...targetThread,
                    messages: [
                        ...targetThread.messages.slice(0, messageIndex),
                        {...targetMessage, status},
                        ...targetThread.messages.slice(messageIndex + 1),
                    ],
                },
                ...threads.slice(threadIndex + 1),
            ];
        };
    };

    return (status: MessageStatus) => {
        setMessageThreadList(markStatusBy(threadUuid, messageUuid, status));
    };
}

function useSetMessagelThreadList() {
    return useSetAtom(messageThreadListAtom);
}

function toChatMessage(message: Message): ChatMessagePayload {
    return {
        role: 'user',
        content: message.content,
    };
}

function payloadFromThread(thread: MessageThread | null, newMessage: Message) {
    const messages = thread?.messages ? [...thread.messages] : [];
    messages.push(newMessage);
    return messages.map(toChatMessage);
}

export function useSendMessageToThread(threadUuid: string) {
    const client = useClientValue();
    const thread = useMessageThreadValueByUuid(threadUuid);
    const setMessageThreadList = useSetMessagelThreadList();
    const setEditing = useSetEditing();
    const addNewMessageToThreadListBy = (threadUuid: string, message: Message) => {
        return (threads: MessageThread[]) => {
            const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

            if (threadIndex < 0) {
                const newThread: MessageThread = {
                    uuid: threadUuid,
                    messages: [message],
                };
                return [newThread, ...threads];
            }

            const targetThread = threads[threadIndex];
            return [
                {
                    ...targetThread,
                    messages: [message, ...targetThread.messages],
                },
                ...threads.slice(0, threadIndex),
                ...threads.slice(threadIndex + 1),
            ];
        };
    };
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
    const markAsGeneratedBy = (threadUuid: string, messageUuid: string) => {
        return (threads: MessageThread[]) => {
            const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

            if (threadIndex < 0) {
                return threads;
            }

            const targetThread = threads[threadIndex];
            const messageIndex = targetThread.messages.findIndex(v => v.uuid === messageUuid);

            if (messageIndex < 0) {
                return threads;
            }

            const targetMessage = targetThread.messages[messageIndex];
            return [
                ...threads.slice(0, threadIndex),
                {
                    ...targetThread,
                    messages: [
                        ...targetThread.messages.slice(0, messageIndex),
                        {...targetMessage, status: 'unread' as const},
                        ...targetThread.messages.slice(messageIndex + 1),
                    ],
                },
                ...threads.slice(threadIndex + 1),
            ];
        };
    };

    return async (uuid: string, content: string) => {
        setEditing(null);
        const userMessage: Message = {
            uuid,
            content,
            sender: 'user',
            createdAt: now(),
            status: 'read',
        };
        setMessageThreadList(addNewMessageToThreadListBy(threadUuid, userMessage));
        const replyUuid = crypto.randomUUID();
        const messages: ChatMessagePayload[] = payloadFromThread(thread, userMessage);
        for await (const chunk of client.callStreaming(uuid, 'modelChat', messages)) {
            setMessageThreadList(appendMessageBy(threadUuid, replyUuid, chunk));
        }
        setMessageThreadList(markAsGeneratedBy(threadUuid, replyUuid));
    };
}
