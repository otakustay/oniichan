import {now} from './string';
import {MessageToolUsage} from './tool';

export type MessageStatus = 'generating' | 'unread' | 'read';

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
        uuid: 'f7bc28c6-7783-4491-a281-ff4e31991840',
        messages: [
            {
                uuid: '1358f430-133c-46ec-81d8-6b6b1a5c7ec9',
                sender: 'assistant',
                content: [
                    'I\'ll help you add a flatMap function to the `over` function. First, let me check the current content of the file structure to understand how the operators are organized.',
                    {
                        id: 'tooluse_v5nuhVnRSdqJDi43zT8gkw',
                        type: 'readDirectory',
                        args: {
                            path: 'src/helper',
                            reason: 'I need to understand the file structure to see how operators are organized.',
                        },
                    },
                    '\n\nLet me check the operators directory to see how other operators are implemented:',
                    {
                        id: 'tooluse_jpzqzaJSTdiCnHk247IgVw',
                        type: 'readDirectory',
                        args: {
                            path: 'src/helper/operators',
                            reason: 'I need to see what operators are available and how they are organized.',
                        },
                    },
                    '\n\nI see that each operator has its own file in the operators directory. Let me check how these operators are implemented:',
                    {
                        id: 'toolu_01UNBH4psSLzHWs4mgxbSjMH',
                        type: 'readFile',
                        args: {
                            path: 'src/helper/operators/map.ts',
                            reason:
                                'I want to see how the map operator is implemented to follow the same pattern for flatMap.',
                        },
                    },
                    'I need to see the interface definitions to match the types correctly.',
                    {
                        id: 'toolu_01Dpzb8ucvCFxUzMrmG38VEb',
                        type: 'readFile',
                        args: {
                            path: 'src/helper/operators/interface.ts',
                            reason: 'I need to see the interface definitions to match the types correctly.',
                        },
                    },
                    'I need to see the over function implementation to add the new flatMap operator.',
                    {
                        id: 'tooluse_XlvUzEqUR0K-M9CUoTw8gQ',
                        type: 'readFile',
                        args: {
                            path: 'src/helper/index.ts',
                            reason: 'I need to see the over function implementation to add the new flatMap operator.',
                        },
                    },
                    '\n\nI\'ll create a new flatMap operator and modify the necessary files. Here\'s what we need to do:\n\n1. First, create a new file for the flatMap operator\n2. Update the interface.ts if needed\n3. Add the flatMap operator to the OverAsyncIterator interface\n4. Add the flatMap method to the over function\n\n```create:src/helper/operators/flatMap.ts\nimport {Transform} from \'./interface.js\';\n\nexport async function* flatMap<T, R>(iterator: AsyncIterable<T>, fn: Transform<T, AsyncIterable<R>>): AsyncIterable<R> {\n    for await (const value of iterator) {\n        const result = await fn(value);\n        for await (const item of result) {\n            yield item;\n        }\n    }\n}\n```\n\nNow let\'s update the index.ts file to include the new flatMap operator:\n\n```diff:src/helper/index.ts\n@@ ... @@\n import {Predicate, Transform} from \'./operators/interface.js\';\n import {filter} from \'./operators/filter.js\';\n import {chunk} from \'./operators/chunk.js\';\n import {debounce} from \'./operators/debounce.js\';\n import {map} from \'./operators/map.js\';\n+import {flatMap} from \'./operators/flatMap.js\';\n import {take} from \'./operators/take.js\';\n import {until} from \'./operators/until.js\';\n \n export interface OverAsyncIterator<T> extends AsyncIterable<T> {\n     filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n     map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n+    flatMap<R>(transform: (value: T) => AsyncIterable<R>): OverAsyncIterator<R>;\n     chunk(size: number): OverAsyncIterator<T[]>;\n     debounce(ms: number): OverAsyncIterator<T[]>;\n     take(count: number): OverAsyncIterator<T>;\n     until(predicate: Predicate<T>): OverAsyncIterator<T>;\n }\n \n export function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n     return {\n         filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n             return over(filter(iterable, predicate));\n         },\n \n         map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n             return over(map(iterable, transform));\n         },\n \n+        flatMap<R>(transform: Transform<T, AsyncIterable<R>>): OverAsyncIterator<R> {\n+            return over(flatMap(iterable, transform));\n+        },\n+\n         chunk(size: number): OverAsyncIterator<T[]> {\n             return over(chunk(iterable, size));\n         },\n@@ -66,7 +71,6 @@\n         [Symbol.asyncIterator]() {\n             return iterable[Symbol.asyncIterator]();\n         },\n     };\n }\n```\n\nI\'ve made the following changes:\n\n1. Created a new `flatMap.ts` file in the operators directory that implements the flatMap functionality. The flatMap operator takes an async iterable and a transform function that returns another async iterable, then yields all items from the transformed iterables in sequence.\n\n2. Updated `index.ts` to:\n   - Import the new flatMap operator\n   - Add the flatMap method to the OverAsyncIterator interface\n   - Implement the flatMap method in the over function\n\nThe flatMap operator follows the same pattern as other operators but adds the ability to flatten nested async iterables. It can be used like this:\n\n```typescript\nconst result = over(source)\n  .flatMap(async (value) => {\n    // return an AsyncIterable<R>\n  });\n```\n\nThis implementation allows for asynchronous transformation and flattening of nested async iterables, which is a common use case in async stream processing.',
                ],
                status: 'read',
                createdAt: '2025-01-08T09:54:00.868Z',
            },
            {
                uuid: '0495b601-9a48-4c16-89f8-c544351794a7',
                sender: 'user',
                content:
                    'I want a flatMap function in over function inside src/helper/index.ts, please reference to the code of other operators, create or modify correct files',
                createdAt: '2025-01-08T09:53:57.349Z',
                status: 'read',
            },
            {
                uuid: '30639170-70b6-4fc0-acba-6e853a25d991',
                sender: 'assistant',
                content: [
                    'I\'ll help you delete the `src/index.ts` file.\n\n```delete:src/index.ts\n```\n\nThe file `src/index.ts` has been deleted.',
                ],
                status: 'read',
                createdAt: '2025-01-08T09:51:11.847Z',
            },
            {
                uuid: '251fe078-e49f-412d-a3b7-c79cc20cbf6c',
                sender: 'user',
                content: 'Totally delete my `src/index.ts`',
                createdAt: '2025-01-08T09:51:07.858Z',
                status: 'read',
            },
            {
                uuid: 'e3c71963-762a-4433-bde2-4a83f4da1656',
                sender: 'assistant',
                content: [
                    'I\'ll help you remove the comments from that file. Let me first read its content and then create a diff to remove the comments.',
                    {
                        id: 'tooluse_aE-x8DiJRzO39GEa5LTT8Q',
                        type: 'readFile',
                        args: {
                            path: 'src/helper/index.ts',
                            reason: 'I need to read the file content to remove its comments.',
                        },
                    },
                    '\n\nI\'ll remove the comments from the file. Here\'s the diff:\n\n```diff:src/helper/index.ts\n@@ ... @@\n export function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n     return {\n-        /**\n-         * Filter elements wiht a predicate\n-         *\n-         * @param predicate Predicate function to decide if an element should be yielded or not\n-         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n-         */\n         filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n             return over(filter(iterable, predicate));\n         },\n \n-        /**\n-         * Map elements wiht a predicate\n-         *\n-         * @param transform Transform function to transform an element into another\n-         * @returns A new `OverAsyncIterator` instance including the `map` operator\n-         */\n         map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n             return over(map(iterable, transform));\n         },\n \n-        /**\n-         * Group elements into chunks by a size\n-         *\n-         * @param size Chunk size\n-         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n-         */\n         chunk(size: number): OverAsyncIterator<T[]> {\n             return over(chunk(iterable, size));\n         },\n \n-        /**\n-         * Debounce the emit of element by a given amount of time,\n-         * all elements within debounce timeout will emit once as an array\n-         *\n-         * @param ms Debounce timeout\n-         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n-         */\n         debounce(ms: number): OverAsyncIterator<T[]> {\n             return over(debounce(iterable, ms));\n         },\n \n-        /**\n-         * Take the first n elements\n-         *\n-         * @param count element count to be token\n-         * @returns A new `OverAsyncIterator` instance including the `take` operator\n-         */\n         take(count: number): OverAsyncIterator<T> {\n             return over(take(iterable, count));\n         },\n \n-        /**\n-         * Take elements until a predicate match\n-         *\n-         * @param predicate Predicate function to decide if the iterator should stop,\n-         * the element match the predicate will not yield\n-         * @returns A new `OverAsyncIterator` instance including the `until` operator\n-         */\n         until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n             return over(until(iterable, predicate));\n         },\n\n```\n\nI\'ve removed all the JSDoc comments from the methods in the `over` function. The code functionality remains exactly the same, just without the documentation comments.',
                ],
                status: 'read',
                createdAt: '2025-01-08T07:20:55.440Z',
            },
            {
                uuid: '6211e4dd-dbe0-448a-84d7-64cab8bf4630',
                sender: 'user',
                content: 'Remove comments in `src/helper/index.ts`',
                createdAt: '2025-01-08T07:20:51.545Z',
                status: 'read',
            },
        ],
    },
    {
        uuid: '444b6fb8-3e5b-4769-93f7-9606960861a5',
        messages: [
            {
                uuid: '6cab1952-1a02-484d-8026-46072c77710f',
                sender: 'assistant',
                content: [
                    'I\'ll help you add a `flatMap` function to the `over` function. First, let\'s create the `flatMap` operator file and then modify the main file to include it.\n\nFirst, let\'s create the flatMap operator:\n\n```create:src/helper/operators/flatMap.ts\n/**\n * Transform each element to an iterable and flatten the result\n *\n * @param source The source async iterable\n * @param transform Function to transform each element to an iterable\n * @returns A new async iterable with transformed and flattened elements\n */\nexport async function* flatMap<T, R>(\n    source: AsyncIterable<T>,\n    transform: (value: T) => AsyncIterable<R> | Iterable<R> | Promise<AsyncIterable<R> | Iterable<R>>\n): AsyncIterable<R> {\n    for await (const value of source) {\n        const result = await transform(value);\n        yield* result;\n    }\n}\n```\n\nNow, let\'s modify the main file to include the flatMap operator:\n\n```diff:src/helper/index.ts\n@@ ... @@\n import {chunk} from \'./operators/chunk.js\';\n import {debounce} from \'./operators/debounce.js\';\n import {filter} from \'./operators/filter.js\';\n+import {flatMap} from \'./operators/flatMap.js\';\n import {map} from \'./operators/map.js\';\n import {take} from \'./operators/take.js\';\n\n export interface OverAsyncIterator<T> extends AsyncIterable<T> {\n     filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n     map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n+    flatMap<R>(transform: (value: T) => AsyncIterable<R> | Iterable<R> | Promise<AsyncIterable<R> | Iterable<R>>): OverAsyncIterator<R>;\n     chunk(size: number): OverAsyncIterator<T[]>;\n     debounce(ms: number): OverAsyncIterator<T[]>;\n     take(count: number): OverAsyncIterator<T>;\n@@ ... @@\n         map<R>(transform: (value: T) => R): OverAsyncIterator<R> {\n             return over(map(iterable, transform));\n         },\n+\n+        /**\n+         * Transform each element to an iterable and flatten the result\n+         *\n+         * @param transform Function to transform each element to an iterable\n+         * @returns A new `OverAsyncIterator` instance including the `flatMap` operator\n+         */\n+        flatMap<R>(transform: (value: T) => AsyncIterable<R> | Iterable<R> | Promise<AsyncIterable<R> | Iterable<R>>): OverAsyncIterator<R> {\n+            return over(flatMap(iterable, transform));\n+        },\n\n         chunk(size: number): OverAsyncIterator<T[]> {\n             return over(chunk(iterable, size));\n         },\n```\n\nThese changes:\n1. Created a new `flatMap.ts` operator file that implements the flatMap functionality\n2. Added the import for the `flatMap` operator in `index.ts`\n3. Added the `flatMap` method to the `OverAsyncIterator` interface\n4. Added the implementation of `flatMap` in the `over` function\n\nThe `flatMap` operator will:\n- Take each element from the source iterable\n- Transform it using the provided transform function into another iterable\n- Flatten the result by yielding each element from the transformed iterable\n\nThis allows you to use it like this:\n```typescript\nconst result = over(source).flatMap(async x => [x, x * 2]);\n// If source is [1, 2, 3], result will be [1, 2, 2, 4, 3, 6]\n```\n\nLet me know if you need any clarification or have questions!',
                ],
                status: 'read',
                createdAt: '2025-01-08T03:41:47.075Z',
            },
            {
                uuid: '470167aa-e362-40f7-99f2-104040149834',
                sender: 'user',
                content: 'Thanks, now I want a `flatMap` function in `over` function',
                createdAt: '2025-01-08T03:41:43.489Z',
                status: 'read',
            },
            {
                uuid: 'e3f02cd7-9b30-401c-b60e-a417a170c2f8',
                sender: 'assistant',
                content: [
                    'I\'ll help you remove the "until" operator. First, let me check the content of the file.',
                    {
                        id: 'toolu_01YFSXkueuUWjq4nBdp6CMc4',
                        type: 'readFile',
                        args: {
                            path: 'src/helper/index.ts',
                        },
                    },
                    '\n\nI\'ll help you remove the "until" operator from the file. We need to:\n1. Remove the import statement for "until"\n2. Remove the "until" method from the interface\n3. Remove the "until" method implementation\n\nHere\'s the change:\n\n```diff:src/helper/index.ts\n@@ ... @@\n import {map} from \'./operators/map.js\';\n import {take} from \'./operators/take.js\';\n-import {until} from \'./operators/until.js\';\n\n export interface OverAsyncIterator<T> extends AsyncIterable<T> {\n     filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n     map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n     chunk(size: number): OverAsyncIterator<T[]>;\n     debounce(ms: number): OverAsyncIterator<T[]>;\n     take(count: number): OverAsyncIterator<T>;\n-    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n }\n\n export function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n@@ ... @@\n         take(count: number): OverAsyncIterator<T> {\n             return over(take(iterable, count));\n         },\n-\n-        /**\n-         * Take elements until a predicate match\n-         *\n-         * @param predicate Predicate function to decide if the iterator should stop,\n-         * the element match the predicate will not yield\n-         * @returns A new `OverAsyncIterator` instance including the `until` operator\n-         */\n-        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n-            return over(until(iterable, predicate));\n-        },\n\n         [Symbol.asyncIterator]() {\n             return iterable[Symbol.asyncIterator]();\n         },\n```\n\nThe changes:\n1. Removed the import of `until` from \'./operators/until.js\'\n2. Removed the `until` method from the `OverAsyncIterator` interface\n3. Removed the implementation of the `until` method from the `over` function\n\nYou might also want to remove the `until.js` file from the operators directory if it\'s no longer needed. Let me know if you want me to help with that.',
                ],
                status: 'read',
                createdAt: '2025-01-07T08:48:04.956Z',
            },
            {
                uuid: '265dbc2e-0788-411d-9c20-ac3e16a0b96e',
                sender: 'user',
                content: 'Remove "until" operator in `src/helper/index.ts`',
                createdAt: '2025-01-07T08:48:02.245Z',
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
                        createdAt: now(),
                    };
                },
                update: message => {
                    if (message.sender === 'assistant') {
                        const lastChunk = message.content.at(-1);
                        if (lastChunk && typeof lastChunk === 'string') {
                            message.content[message.content.length - 1] = lastChunk + chunk;
                        }
                        else {
                            message.content.push(chunk);
                        }
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
