import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {updateItemInArray} from '@oniichan/shared/array';
import {
    InboxSendMessageRequest,
    InboxMarkRoundtripStatusRequest,
    InboxApproveToolRequest,
} from '@oniichan/kernel/protocol';
import {
    RoundtripStatus,
    MessageThreadData,
    AssistantTextMessageData,
    MessageViewChunk,
    MessageInputChunk,
    ReasoningMessageChunk,
    RoundtripMessageData,
    AssistantMessageData,
    assertTaggedChunk,
    assertToolCallChunk,
    assertPlanChunk,
} from '@oniichan/shared/inbox';
import {assertNever} from '@oniichan/shared/error';
import {useIpcValue} from './ipc';
import {useSetDraftContent, useSetEditing} from './draft';

export const messageThreadListAtom = atom<MessageThreadData[]>([]);

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

export function useMarkMessageStatus(threadUuid: string, messageUuid: string) {
    const ipc = useIpcValue();

    return (status: RoundtripStatus) => {
        const request: InboxMarkRoundtripStatusRequest = {threadUuid, messageUuid, status};
        void ipc.kernel.call(crypto.randomUUID(), 'inboxMarkMessageStatus', request).then(() => {});
    };
}

export function useSetMessagelThreadList() {
    return useSetAtom(messageThreadListAtom);
}

interface ResponseUpdateOptions {
    create: () => AssistantMessageData;
    update: (message: AssistantMessageData) => AssistantMessageData;
}

function locateRoundtripByMessageUuid(uuid: string) {
    return (roundtrip: RoundtripMessageData) => {
        return roundtrip.request.uuid === uuid || roundtrip.responses.some(v => v.uuid === uuid);
    };
}

function createResponseUpdate(threadUuid: string, messageUuid: string, options: ResponseUpdateOptions) {
    return (threads: MessageThreadData[]): MessageThreadData[] => {
        const {create, update} = options;
        const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

        if (threadIndex < 0) {
            return threads;
        }

        const targetThread = threads[threadIndex];

        const roundtripIndex = targetThread.roundtrips.findIndex(locateRoundtripByMessageUuid(messageUuid));

        if (roundtripIndex < 0) {
            return threads;
        }

        const targetRoundtrip = targetThread.roundtrips[roundtripIndex];

        // It's impossible to update the request message
        const messageIndex = targetRoundtrip.responses.findIndex(v => v.uuid === messageUuid);

        if (messageIndex < 0) {
            const newMessage = create();
            return [
                ...threads.slice(0, threadIndex),
                {
                    ...targetThread,
                    roundtrips: [
                        ...targetThread.roundtrips.slice(0, roundtripIndex),
                        {
                            ...targetRoundtrip,
                            responses: [
                                ...targetRoundtrip.responses,
                                update(newMessage),
                            ],
                        },
                        ...targetThread.roundtrips.slice(roundtripIndex + 1),
                    ],
                },
                ...threads.slice(threadIndex + 1),
            ];
        }

        const targetMessage = targetRoundtrip.responses[messageIndex];
        return [
            ...threads.slice(0, threadIndex),
            {
                ...targetThread,
                roundtrips: [
                    ...targetThread.roundtrips.slice(0, roundtripIndex),
                    {
                        ...targetRoundtrip,
                        responses: [
                            ...targetRoundtrip.responses.slice(0, messageIndex),
                            update(targetMessage),
                            ...targetRoundtrip.responses.slice(messageIndex + 1),
                        ],
                    },
                    ...targetThread.roundtrips.slice(roundtripIndex + 1),
                ],
            },
            ...threads.slice(threadIndex + 1),
        ];
    };
}

function handleChunkToAssistantMessage<T extends AssistantMessageData>(message: T, chunk: MessageInputChunk): T {
    // Reasoning chunk should be unique and on top of all chunks
    if (chunk.type === 'reasoning') {
        return {
            ...message,
            chunks: updateItemInArray<MessageViewChunk, ReasoningMessageChunk>(
                message.chunks,
                {
                    find: item => item.type === 'reasoning',
                    create: () => ({type: 'reasoning', content: chunk.content}),
                    update: current => ({type: 'reasoning', content: current.content + chunk.content}),
                    moveToTop: true,
                }
            ),
        };
    }
    if (chunk.type === 'text') {
        const lastChunk = message.chunks.at(-1);

        if (lastChunk?.type === 'text') {
            return {
                ...message,
                chunks: [
                    ...message.chunks.slice(0, -1),
                    {type: 'text', content: lastChunk.content + chunk.content},
                ],
            };
        }

        return {
            ...message,
            chunks: [...message.chunks, chunk],
        };
    }

    // We don't store source in web
    if (chunk.type === 'textInTool' || chunk.type === 'textInPlan' || chunk.type === 'planTaskEnd') {
        return message;
    }

    if (chunk.type === 'contentStart') {
        return {
            ...message,
            chunks: [
                ...message.chunks,
                {type: 'content', tagName: chunk.tagName, content: '', status: 'generating'},
            ],
        };
    }
    if (chunk.type === 'toolStart') {
        return {
            ...message,
            chunks: [
                ...message.chunks,
                {
                    type: 'toolCall',
                    toolName: chunk.toolName,
                    arguments: {},
                    status: 'generating',
                    fileEdit: null,
                    source: chunk.source,
                },
            ],
        };
    }
    if (chunk.type === 'planStart') {
        return {
            ...message,
            chunks: [
                ...message.chunks,
                {type: 'plan', tasks: [], source: chunk.source},
            ],
        };
    }

    const lastChunk = message.chunks.at(-1);

    if (chunk.type === 'contentDelta') {
        assertTaggedChunk(lastChunk, 'Unexpected thinking delta chunk coming without a start chunk');
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    content: lastChunk.content + chunk.source,
                },
            ],
        };
    }
    else if (chunk.type === 'contentEnd') {
        assertTaggedChunk(lastChunk, 'Unexpected thinking end chunk coming without a start chunk');
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    status: 'completed',
                },
            ],
        };
    }
    else if (chunk.type === 'toolDelta') {
        assertToolCallChunk(lastChunk, 'Unexpected tool delta chunk coming without a start chunk');
        const args = {...lastChunk.arguments};
        for (const [key, value] of Object.entries(chunk.arguments)) {
            const previousValue = args[key] ?? '';
            args[key] = previousValue + value;
        }
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    arguments: args,
                },
            ],
        };
    }
    else if (chunk.type === 'toolEnd') {
        assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    status: 'completed',
                },
            ],
        };
    }
    else if (chunk.type === 'planTaskStart') {
        assertPlanChunk(lastChunk, 'Unexpected plan task start chunk coming without a plan start chunk');
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    tasks: [
                        ...lastChunk.tasks,
                        {taskType: chunk.taskType, text: ''},
                    ],
                },
            ],
        };
    }
    else if (chunk.type === 'planTaskDelta') {
        assertPlanChunk(lastChunk, 'Unexpected plan task delta chunk coming without a plan start chunk');
        const lastTask = lastChunk.tasks.at(-1);

        if (!lastTask) {
            throw new Error('Unexpected plan task delta chunk coming without an existing task');
        }
        if (lastTask.taskType !== chunk.taskType) {
            throw new Error('Unexpected plan task delta chunk coming without corresponding task');
        }

        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -2),
                {
                    ...lastChunk,
                    tasks: [
                        ...lastChunk.tasks.slice(0, -1),
                        {taskType: lastTask.taskType, text: lastTask.text + chunk.source},
                    ],
                },
            ],
        };
    }
    else if (chunk.type === 'planEnd') {
        assertPlanChunk(lastChunk, 'Unexpected plan task delta chunk coming without a plan start chunk');
        return {
            ...message,
            chunks: [
                ...message.chunks.slice(0, -1),
                {
                    ...lastChunk,
                    status: 'completed',
                },
            ],
        };
    }
    else {
        assertNever<{type: string}>(chunk, v => `Unknown chunk type: ${v.type}`);
    }
}

function appendResponseMessageBy(threadUuid: string, messageUuid: string, chunk: MessageInputChunk) {
    return createResponseUpdate(
        threadUuid,
        messageUuid,
        {
            create: () => {
                const message: AssistantTextMessageData = {
                    uuid: messageUuid,
                    type: 'assistantText',
                    chunks: [],
                    createdAt: now(),
                };
                return handleChunkToAssistantMessage(message, chunk);
            },
            update: message => {
                return handleChunkToAssistantMessage(message, chunk);
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
            threadUuid,
            uuid,
            body: {
                type: 'text',
                content: content,
            },
        };
        for await (const chunk of ipc.kernel.callStreaming(uuid, 'inboxSendMessage', request)) {
            setMessageThreadList(appendResponseMessageBy(threadUuid, chunk.replyUuid, chunk.value));
        }
    };
}

export function useApproveTool(threadUuid: string, messageUuid: string) {
    const ipc = useIpcValue();
    const setMessageThreadList = useSetMessagelThreadList();
    return async (taskId: string, approved: boolean) => {
        const request: InboxApproveToolRequest = {
            threadUuid,
            requestMessageUuid: messageUuid,
            approved,
        };
        for await (const chunk of ipc.kernel.callStreaming(taskId, 'inboxApproveTool', request)) {
            setMessageThreadList(appendResponseMessageBy(threadUuid, chunk.replyUuid, chunk.value));
        }
    };
}
