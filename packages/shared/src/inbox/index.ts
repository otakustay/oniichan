import {MessageThread, MessageThreadData, MessageThreadPersistData} from './thread';

export {
    ToolCallMessageChunk,
    EmbeddingSearchMessageChunk,
    EmbeddingSearchResultItem,
    PlainTextMessageChunk,
    ThinkingMessageChunk,
    MessageContentChunk,
    DebugContentChunk,
    MessageViewChunk,
    Message,
    MessageStatus,
    ToolUseMessage,
    ToolCallMessage,
    UserRequestMessage,
    AssistantTextMessage,
    DebugMessage,
    MessageData,
    ToolUseMessageData,
    ToolCallMessageData,
    UserRequestMessageData,
    AssistantTextMessageData,
    DebugMessageLevel,
    DebugMessageData,
    MessageType,
} from './message';
export {Roundtrip} from './roundtrip';
export {MessageThread, MessageThreadData, MessageThreadPersistData} from './thread';
export {Workflow, WorkflowOriginMessage, WorkflowStatus} from './workflow';

const debugMessageThreadFixtures: MessageThreadPersistData[] = [
    {
        uuid: '7c4e4530-df10-488d-9dff-5402b2f39203',
        roundtrips: [
            {
                request: {
                    uuid: 'b036b594-4f0d-4d45-944e-65a7a8dfae90',
                    createdAt: '2025-01-24T05:33:35.622Z',
                    status: 'read',
                    type: 'userRequest',
                    content: 'Hello',
                },
                responses: [
                    {
                        type: 'message',
                        message: {
                            uuid: 'ac035915-5aa8-42ea-9041-c6cdcd1f4405',
                            createdAt: '2025-01-24T05:33:35.638Z',
                            status: 'read',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content:
                                        'Hello! I\'m here to help you with any programming-related questions or tasks. Feel free to ask anything about:\n\n- Writing new code\n- Debugging existing code\n- Code review and optimization\n- Software architecture and design\n- Best practices and patterns\n- Any specific programming language\n- General software development topics\n\nWhat would you like help with?',
                                },
                            ],
                        },
                    },
                ],
            },
            {
                request: {
                    uuid: '2599a9eb-e97d-49c8-8f12-8f4766abc8bd',
                    createdAt: '2025-01-24T05:33:48.777Z',
                    status: 'read',
                    type: 'userRequest',
                    content: 'Bubble sort in JS',
                },
                responses: [
                    {
                        type: 'message',
                        message: {
                            uuid: '94203d02-2953-4a62-9992-20fa6d036490',
                            createdAt: '2025-01-24T05:33:48.782Z',
                            status: 'read',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content:
                                        'I\'ll help you create a bubble sort implementation in JavaScript. Bubble sort is a simple sorting algorithm that repeatedly compares adjacent elements and swaps them if they\'re in the wrong order.\n\nHere\'s a clear implementation with comments explaining each step:\n\n```javascript\nfunction bubbleSort(arr) {\n    // Get the length of the array\n    const len = arr.length;\n    \n    // Flag to optimize the algorithm\n    let swapped;\n    \n    // Outer loop to go through the array multiple times\n    do {\n        swapped = false;\n        \n        // Inner loop to compare adjacent elements\n        for (let i = 0; i < len - 1; i++) {\n            // If current element is greater than next element, swap them\n            if (arr[i] > arr[i + 1]) {\n                // Perform swap using destructuring assignment\n                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];\n                swapped = true;\n            }\n        }\n    } while (swapped); // Continue until no swaps are needed\n    \n    return arr;\n}\n\n// Example usage:\nconst numbers = [64, 34, 25, 12, 22, 11, 90];\nconsole.log(\'Original array:\', numbers);\nconsole.log(\'Sorted array:\', bubbleSort(numbers));\n```\n\nKey points about this implementation:\n\n1. The outer `do...while` loop continues until no more swaps are needed (array is sorted)\n2. The `swapped` flag optimizes the algorithm by breaking out when no swaps are performed\n3. The inner `for` loop compares adjacent elements\n4. Modern JavaScript destructuring is used for clean swap operations\n\nTime Complexity:\n- Worst and Average case: O(n²)\n- Best case: O(n) when array is already sorted\n\nSpace Complexity:\n- O(1) as it sorts in-place\n\nYou can test it with different arrays:\n\n```javascript\n// More test cases\nconsole.log(bubbleSort([5, 3, 8, 4, 2]));        // [2, 3, 4, 5, 8]\nconsole.log(bubbleSort([1]));                     // [1]\nconsole.log(bubbleSort([]));                      // []\nconsole.log(bubbleSort([1, 1, 1, 1]));           // [1, 1, 1, 1]\nconsole.log(bubbleSort([10, 9, 8, 7, 6]));       // [6, 7, 8, 9, 10]\n```\n\nIf you want to sort in descending order instead, simply change the comparison operator from `>` to `<`:\n\n```javascript\nif (arr[i] < arr[i + 1]) {  // Changed from > to <\n    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];\n    swapped = true;\n}\n```\n\nWould you like me to explain any part of the implementation in more detail?',
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
];

export class ThreadStore {
    private threads: MessageThread[] = process.env.NODE_ENV === 'development'
        ? debugMessageThreadFixtures.map(v => MessageThread.from(v))
        : [];

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
