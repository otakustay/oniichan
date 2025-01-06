import {now} from './string';

export type MessageStatus = 'generating' | 'unread' | 'read';

export interface PathArguments {
    path: string;
}

export interface GlobArguments {
    glob: string;
}

export interface MessageReadFileUsage {
    id: string;
    type: 'readFile';
    args: PathArguments;
}

export interface MessageReadDirectoryUsage {
    id: string;
    type: 'readDirectory';
    args: PathArguments;
}

export interface MessageFindFilesUsage {
    id: string;
    type: 'findFiles';
    args: GlobArguments;
}

export type MessageToolUsage = MessageReadFileUsage | MessageReadDirectoryUsage | MessageFindFilesUsage;

interface MessageBase {
    uuid: string;
    createdAt: string;
    status: MessageStatus;
    error?: string;
}

interface UserMessage extends MessageBase {
    sender: 'user';
    content: string;
}

interface AssistantMessage extends MessageBase {
    sender: 'assistant';
    content: Array<string | MessageToolUsage>;
}

export type Message = UserMessage | AssistantMessage;

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
        uuid: '91a68728-01b4-4aa8-9e89-a8b5f491086b',
        messages: [
            {
                uuid: '2193b2fa-4042-443e-bb5e-fc724137a28c',
                sender: 'assistant',
                content: [
                    'I\'ll help you remove the `filter` operator from your project. This involves removing it from multiple files:\n\n1. First, let\'s remove the `filter.ts` file:\n\n```delete:src/helper/operators/filter.ts\n```\n\n2. Now, let\'s modify the `src/helper/index.ts` file to remove all filter-related code:\n\n```edit:src/helper/index.ts\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\nimport {flatMap} from \'./operators/flatMap.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    flatMap<R>(transform: (value: T) => AsyncIterable<R>): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * FlatMap elements with a transformer that returns an AsyncIterable\n         *\n         * @param transform Transform function to transform an element into an AsyncIterable\n         * @returns A new `OverAsyncIterator` instance including the `flatMap` operator\n         */\n        flatMap<R>(transform: (value: T) => AsyncIterable<R>): OverAsyncIterator<R> {\n            return over(flatMap(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns',
                ],
                status: 'read',
                createdAt: '2025-01-03T10:31:13.422Z',
            },
            {
                uuid: '97ff6522-7524-47e0-8d5a-ba614c5ec890',
                sender: 'user',
                content:
                    'Good, now I want to remove my `filter` operator, please help me to achieve this in my project.',
                createdAt: '2025-01-03T10:31:10.360Z',
                status: 'read',
            },
            {
                uuid: '817d6c86-1abc-42fe-9db9-ffc47466b657',
                sender: 'assistant',
                content: [
                    'I\'ll help you add a `flatMap` function to the `over` function in the helper module. Let me first check the existing code structure.\n\n',
                    {
                        id: 'toolu_01JvBNn6gCXHHvfmd6zeWSsJ',
                        type: 'findFiles',
                        args: {glob: 'src/helper/*.ts'},
                    },
                    'Let me check the existing operators to implement the `flatMap` function in a consistent way.\n\n',
                    {
                        id: 'tooluse_N0EZdn1TQWum4OhzZA536Q',
                        type: 'readFile',
                        args: {path: 'src/helper/operators/map.ts'},
                    },
                    'Let me help you add the `flatMap` function. First, let\'s create a new file for the `flatMap` operator:\n\n```typescript:src/helper/operators/flatMap.ts\nimport {Transform} from \'./interface.js\';\n\nexport async function* flatMap<T, R>(iterator: AsyncIterable<T>, fn: Transform<T, AsyncIterable<R>>): AsyncIterable<R> {\n    for await (const value of iterator) {\n        const result = await fn(value);\n        for await (const item of result) {\n            yield item;\n        }\n    }\n}\n```\n\nNow, let\'s modify the `src/helper/index.ts` file to include the `flatMap` operator:\n\n```edit:src/helper/index.ts\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\nimport {flatMap} from \'./operators/flatMap.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    flatMap<R>(transform: (value: T) => AsyncIterable<R>): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * FlatMap elements with a transformer that returns an AsyncIterable\n         *\n         * @param transform Transform function to transform an element into an AsyncIterable\n         * @returns A new `OverAsyncIterator` instance including the `flatMap` operator\n         */\n        flatMap<R>(transform: (value: T) => AsyncIterable<R>): OverAsyncIterator<R> {\n            return over(flatMap(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n```\n\nI\'ve added the following changes:\n\n1. Created a new file `flatMap.ts` in the operators directory that implements the `flatMap` functionality.\n2. Added the `flatMap` import to the main index.ts file.\n3. Added the `flatMap` method to the `OverAsyncIterator` interface.\n4. Implemented the `flatMap` method in the `over` function.\n\nThe `flatMap` operator works similarly to `map`, but it expects the transform function to return an `AsyncIterable<R>` instead of just `R`. It will then flatten the result by yielding each item from the returned iterables one by one.\n\nYou can use it like this:\n\n```typescript\n// Example usage\nconst source = over(asyncIterable);\nconst result = source.flatMap(async value => {\n    // Return an AsyncIterable that will be flattened\n    return someAsyncGenerator(value);\n});\n\nfor await (const item of result) {\n    console.log(item);\n}\n```\n\nThis implementation follows the same patterns as the other operators in the codebase, maintaining consistency in the API design and implementation style.',
                ],
                status: 'read',
                createdAt: '2025-01-03T10:29:37.197Z',
            },
            {
                uuid: '04792c28-0729-4b47-affd-9206cf2e4f0d',
                sender: 'user',
                content:
                    'I want a `flatMap` function in `over` function inside `src/helper/index.ts`, please reference to the code of other operators, create or modify correct files',
                createdAt: '2025-01-03T10:29:34.184Z',
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
                content: [
                    'Here\'s a bubble sort implementation in TypeScript:\n\n```typescript\nfunction bubbleSort<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    // Create a copy of the array to avoid modifying the original\n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        \n        // Loop through the array\n        for (let i = 0; i < len - 1; i++) {\n            // Compare adjacent elements\n            if (sortedArr[i] > sortedArr[i + 1]) {\n                // Swap elements if they are in wrong order\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped); // Continue until no swaps are needed\n    \n    return sortedArr;\n}\n\n// Example usage:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconsole.log("Original array:", numbers);\nconsole.log("Sorted array:", bubbleSort(numbers));\n\nconst strings = ["banana", "apple", "cherry", "date"];\nconsole.log("Original array:", strings);\nconsole.log("Sorted array:", bubbleSort(strings));\n```\n\nThis implementation includes several TypeScript-specific features:\n\n1. Generic type parameter `<T>` allows the function to work with arrays of any type that can be compared\n2. Type annotations for the parameters and return value\n3. Creates a copy of the input array to maintain immutability\n\nThe bubble sort algorithm works by:\n\n1. Repeatedly stepping through the array\n2. Comparing adjacent elements\n3. Swapping them if they are in the wrong order\n4. Continuing until no swaps are needed (array is sorted)\n\nYou can also create a version that sorts in descending order by simply changing the comparison operator:\n\n```typescript\nfunction bubbleSortDescending<T>(arr: T[]): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (sortedArr[i] < sortedArr[i + 1]) { // Changed comparison operator\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n```\n\nIf you want to make it more flexible, you can add a custom comparison function:\n\n```typescript\nfunction bubbleSortWithComparator<T>(\n    arr: T[], \n    comparator: (a: T, b: T) => number\n): T[] {\n    const len = arr.length;\n    let swapped: boolean;\n    \n    const sortedArr = [...arr];\n    \n    do {\n        swapped = false;\n        for (let i = 0; i < len - 1; i++) {\n            if (comparator(sortedArr[i], sortedArr[i + 1]) > 0) {\n                [sortedArr[i], sortedArr[i + 1]] = [sortedArr[i + 1], sortedArr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped);\n    \n    return sortedArr;\n}\n\n// Example usage with custom comparator:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconst descendingSort = bubbleSortWithComparator(numbers, (a, b) => b - a);\nconsole.log("Sorted in descending order:", descendingSort);\n```\n\nThis implementation provides type safety and flexibility while maintaining the classic bubble sort algorithm\'s simplicity.',
                ],
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
                content: [
                    'I don\'t have access to real-time information, including the current time. I cannot tell you the exact time right now. To check the current time, you can:\n\n1. Look at your device\'s clock\n2. Check your watch\n3. Use an online time service\n4. Ask your device\'s virtual assistant (Siri, Google Assistant, etc.)',
                ],
                createdAt: '2021-07-30T06:58:49.335Z',
                status: 'generating',
                error: 'Connection reset',
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
                content: [
                    'I\'m Claude, an AI assistant created by Anthropic. I aim to be direct and honest in my communications, including about being an AI. I\'m curious - what made you interested in learning more about me?',
                ],
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
                        content: [chunk],
                        status: 'generating',
                        references: [],
                        createdAt: now(),
                    };
                },
                update: message => {
                    if (message.sender === 'assistant') {
                        message.content.push(chunk);
                    }
                    else {
                        message.content += chunk;
                    }
                },
            }
        );
    }

    addToolUsage(threadUuid: string, messageUuid: string, usage: MessageToolUsage) {
        this.updateMessage(
            threadUuid,
            messageUuid,
            {
                create: () => {
                    return {
                        uuid: messageUuid,
                        sender: 'assistant',
                        content: [usage],
                        status: 'unread',
                        createdAt: now(),
                    };
                },
                update: message => {
                    if (message.sender === 'assistant') {
                        message.content.push(usage);
                    }
                    else {
                        throw new Error('Unable to add tool usage to user message');
                    }
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
                        content: [],
                        error,
                        status: 'unread',
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
