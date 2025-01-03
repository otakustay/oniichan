import {now} from './string';

export type MessageStatus = 'generating' | 'unread' | 'read';

export interface MessageFileReference {
    id: string;
    type: 'file';
    path: string;
}

export interface MessageDirectoryReference {
    id: string;
    type: 'directory';
    path: string;
}

export interface MessageFindReference {
    id: string;
    type: 'find';
    pattern: string;
}

export type MessageReference = MessageFileReference | MessageDirectoryReference | MessageFindReference;

export interface Message {
    uuid: string;
    sender: 'user' | 'assistant';
    content: string;
    createdAt: string;
    status: MessageStatus;
    references: MessageReference[];
    error?: string;
}

export interface MessageThread {
    uuid: string;
    messages: Message[];
}

interface MessageUpdateHelper {
    create?: () => Message;
    update: (message: Message) => void;
}

const debugMessageThreadFixtures: MessageThread[] = [
    {
        uuid: 'eea4bdb9-c8c0-4b64-81ef-7d542aa13b1e',
        messages: [
            {
                uuid: '9fae536b-a78f-4d5d-94ab-f423a2fc75a2',
                sender: 'assistant',
                content:
                    'I\'ll look at the source code first to ensure consistency with your codebase.\n\nI\'ll create both a `flatMap` and `compact` operator according to your codebase patterns. Let me check some of the existing operator implementations first.\n\nI\'ll help you create both `flatMap` and `compact` operators based on the existing patterns in your codebase. Let\'s implement them one by one.\n\n1. First, let\'s create the `flatMap` operator:\n\n```typescript:src/helper/operators/flatMap.ts\nimport { Transform } from \'./interface.js\';\n\nexport async function* flatMap<T, R>(iterator: AsyncIterable<T>, fn: Transform<T, R[]>): AsyncIterable<R> {\n    for await (const value of iterator) {\n        const result = await fn(value);\n        for (const item of result) {\n            yield item;\n        }\n    }\n}\n```\n\n2. Now, let\'s create the `compact` operator that removes null and undefined values:\n\n```typescript:src/helper/operators/compact.ts\nexport async function* compact<T>(iterator: AsyncIterable<T>): AsyncIterable<NonNullable<T>> {\n    for await (const ',
                status: 'read',
                references: [
                    {
                        id: 'tooluse_SALAs7jdQ5OPXLkDy3eEyg',
                        type: 'find',
                        pattern: 'src/helper/**/*.ts',
                    },
                    {
                        id: 'toolu_01To4veWVi2ARiHpUovWcUy5',
                        type: 'file',
                        path: 'src/helper/operators/interface.ts',
                    },
                    {
                        id: 'tooluse_dB12d0MqRO-z-EBa4wYJrQ',
                        type: 'file',
                        path: 'src/helper/operators/map.ts',
                    },
                ],
                createdAt: '2025-01-03T07:11:01.204Z',
            },
            {
                uuid: 'cfb416f4-7e77-4c9b-aafa-2f27b30d134f',
                sender: 'user',
                content: 'I still need a `compact` operator',
                createdAt: '2025-01-03T07:10:57.429Z',
                references: [],
                status: 'read',
            },
            {
                uuid: 'bff80455-4496-4f92-990e-009fbbb06048',
                sender: 'assistant',
                content:
                    'I\'ll help you write a `flatMap` operator. Let me first check the source code directory you mentioned.\n\nLet me check the operators directory to see the existing operators and their structure.\n\nI\'ll help you write a `flatMap` operator. Based on the directory structure, we should create this in the `src/helper/operators` directory. Let\'s call it `flatMap.ts`. The `flatMap` operator will transform each value from the source observable using a mapping function that returns an observable, and then flattens the results into a single observable.\n\nHere\'s the implementation:\n\n```typescript:src/helper/operators/flatMap.ts\nimport { Observable } from \'../../types\';\nimport { Operator } from \'./interface\';\n\nexport function flatMap<T, R>(\n  project: (value: T) => Observable<R>\n): Operator<T, R> {\n  return (source: Observable<T>): Observable<R> => {\n    return (subscriber) => {\n      const subscriptions = new Set<() => void>();\n      \n      // Subscribe to the source observable\n      const sourceSubscription = source((value) => {\n        try {\n          // Get the inner observable from the project function\n          const innerObservable = project(value);\n          \n          // Subscribe to the inner observable\n          const innerSubscription = innerObservable((innerValue) => {\n            subscriber(innerValue);\n          });\n          \n          // Keep track of inner subscriptions\n          subscriptions.add(innerSubscription);\n        } catch (error) {\n          // Handle any errors that occur during projection\n          console.error(\'Error in flatMap:\', error);\n        }\n      });\n      \n      // Return cleanup function\n      return () => {\n        // Clean up all inner subscriptions\n        subscriptions.forEach((unsubscribe) => unsubscribe());\n        subscriptions.clear();\n        // Clean up source subscription\n        sourceSubscription();\n      };\n    };\n  };\n}\n```\n\nThis implementation:\n\n1. Takes a `project` function that maps each value to an Observable\n2. Returns an operator function that transforms the source observable\n3. For each value from the source:\n   - Applies the project function to get an inner observable\n   - Subscribes to the inner observable\n   - Emits all values from the inner observable\n4. Manages subscriptions properly to avoid memory leaks\n5. Provides proper cleanup through the unsubscribe function\n\nYou can use this operator like this:\n\n```typescript\nimport { flatMap } from \'./operators/flatMap\';\n\n// Example usage\nconst source$ = /* some observable */;\nconst result$ = source$.pipe(\n  flatMap(value => /* return an observable */)\n);\n```\n\nYou might also want to add a test file. Would you like me to provide a test implementation as well?',
                status: 'read',
                references: [
                    {
                        id: 'toolu_011hpmqGDvGcNtwxic8o5hy7',
                        type: 'directory',
                        path: 'src/helper',
                    },
                    {
                        id: 'tooluse_99WI2jcKRrmRvAcKZKSbcg',
                        type: 'directory',
                        path: 'src/helper/operators',
                    },
                ],
                createdAt: '2025-01-03T05:36:33.402Z',
            },
            {
                uuid: '143b1084-121e-4c80-a718-22bd7dcb3ca7',
                sender: 'user',
                content: 'Write a `flatMap` operator for me according to source code in `src/helper`',
                createdAt: '2025-01-03T05:36:30.974Z',
                references: [],
                status: 'read',
            },
        ],
    },
    {
        uuid: '2f773372-aa66-4b9f-a17c-b8c5f57a1fc5',
        messages: [
            {
                uuid: 'f38abde6-d527-4141-8e30-e42bc291a0d0',
                sender: 'assistant',
                content:
                    'Here\'s a bubble sort implementation in TypeScript:\n\n```typescript\nfunction bubbleSort<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    // Create a copy of the array to avoid modifying the original\n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        \n        // Loop through the array\n        for (let i = 0; i < len - 1; i++) {\n            // Compare adjacent elements\n            if (sortedArr[i] > sortedArr[i + 1]) {\n                // Swap elements if they are in wrong order\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped); // Continue until no swaps are needed\n    \n    return sortedArr;\n}\n\n// Example usage:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconsole.log("Original array:", numbers);\nconsole.log("Sorted array:", bubbleSort(numbers));\n\nconst strings = ["banana", "apple", "cherry", "date"];\nconsole.log("Original array:", strings);\nconsole.log("Sorted array:", bubbleSort(strings));\n```\n\nThis implementation includes several TypeScript-specific features:\n\n1. Generic type parameter `<T>` allows the function to work with arrays of any type that can be compared\n2. Type annotations for the parameters and return value\n3. Creates a copy of the input array to maintain immutability\n\nThe bubble sort algorithm works by:\n\n1. Repeatedly stepping through the array\n2. Comparing adjacent elements\n3. Swapping them if they are in the wrong order\n4. Continuing until no swaps are needed (array is sorted)\n\nYou can also create a version that sorts in descending order by simply changing the comparison operator:\n\n```typescript\nfunction bubbleSortDescending<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (sortedArr[i] < sortedArr[i + 1]) { // Changed comparison operator\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n```\n\nIf you want to make it more flexible, you can add a custom comparison function:\n\n```typescript\nfunction bubbleSortWithComparator<T>(\n    arr: T[], \n    comparator: (a: T, b: T) => number\n): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (comparator(sortedArr[i], sortedArr[i + 1]) > 0) {\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n\n// Example usage with custom comparator:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconst descendingSort = bubbleSortWithComparator(numbers, (a, b) => b - a);\nconsole.log("Sorted in descending order:", descendingSort);\n```\n\nThis implementation provides type safety and flexibility while maintaining the classic bubble sort algorithm\'s simplicity.',
                createdAt: '2024-12-21T08:45:28.013Z',
                references: [],
                status: 'unread',
            },
            {
                uuid: 'adc7531d-fe47-49a3-9e8b-cfdfa8aac443',
                sender: 'user',
                createdAt: '2024-12-21T08:45:13.339Z',
                content: 'I\'d love to have a bubble sort written in TypeScript',
                references: [],
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
                references: [],
                error: 'Connection reset',
            },
            {
                uuid: '09ebe07d-61dc-4981-b2cb-6eb1f8d6ffb0',
                sender: 'user',
                content: 'Do you have information about the exact time now?',
                createdAt: '2021-07-30T06:58:49.335Z',
                references: [],
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
                references: [],
                status: 'read',
            },
            {
                uuid: '3f8b94da-904b-471e-afaf-8d48e1e0d22d',
                sender: 'user',
                content: 'Who are you?',
                createdAt: '2021-07-30T06:58:49.335Z',
                references: [],
                status: 'read',
            },
        ],
    },
];

export class ThreadStore {
    private threads: MessageThread[] = process.env.NODE_ENV === 'development' ? debugMessageThreadFixtures : [];

    getThreadByUuid(uuid: string) {
        return this.threads.find(v => v.uuid === uuid) ?? null;
    }

    addNewMessageToThreadList(threadUuid: string, message: Message) {
        const thread = this.getThreadByUuid(threadUuid);

        if (thread) {
            thread.messages.unshift(message);
        }
        else {
            const newThread: MessageThread = {
                uuid: threadUuid,
                messages: [message],
            };
            this.threads.unshift(newThread);
        }
    }

    appendMessage(threadUuid: string, messageUuid: string, chunk: string) {
        this.updateMessage(
            threadUuid,
            messageUuid,
            {
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
                    message.content += chunk;
                },
            }
        );
    }

    addReference(threadUuid: string, messageUuid: string, reference: MessageReference) {
        this.updateMessage(
            threadUuid,
            messageUuid,
            {
                create: () => {
                    return {
                        uuid: messageUuid,
                        sender: 'assistant',
                        content: '',
                        status: 'unread',
                        references: [reference],
                        createdAt: now(),
                    };
                },
                update: message => {
                    message.references.push(reference);
                },
            }
        );
    }

    setMessageError(threadUuid: string, messageUuid: string, error: string) {
        this.updateMessage(
            threadUuid,
            messageUuid,
            {
                create: () => {
                    return {
                        uuid: messageUuid,
                        sender: 'assistant',
                        content: '',
                        error,
                        status: 'unread',
                        references: [],
                        createdAt: now(),
                    };
                },
                update: message => {
                    message.error = error;
                },
            }
        );
    }

    markStatus(threadUuid: string, messageUuid: string, status: MessageStatus) {
        this.updateMessage(
            threadUuid,
            messageUuid,
            {
                update: message => {
                    message.status = status;
                },
            }
        );
    }

    dump() {
        return [...this.threads];
    }

    private updateMessage(threadUuid: string, messageUuid: string, helper: MessageUpdateHelper) {
        const threadIndex = this.threads.findIndex(v => v.uuid === threadUuid);

        if (threadIndex < 0) {
            return;
        }

        const targetThread = this.threads[threadIndex];
        const message = targetThread.messages.find(v => v.uuid === messageUuid);

        if (message) {
            helper.update(message);
        }
        else if (helper.create) {
            const newMessage = helper.create();
            targetThread.messages.unshift(newMessage);
        }
        else {
            throw new Error(`Unable to update non-existing message ${messageUuid}`);
        }

        this.threads.splice(threadIndex, 1);
        this.threads.unshift(targetThread);
    }
}
