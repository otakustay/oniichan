import {atom, useAtomValue, useSetAtom} from 'jotai';
import {now} from '@oniichan/shared/string';
import {updateItemInArray} from '@oniichan/shared/array';
import {InboxSendMessageRequest, InboxMarkRoundtripStatusRequest} from '@oniichan/kernel/protocol';
import {
    MessageData,
    RoundtripStatus,
    MessageThreadData,
    AssistantTextMessageData,
    ToolCallMessageData,
    MessageContentChunk,
    ToolCallMessageChunk,
    ThinkingMessageChunk,
    MessageInputChunk,
    ReasoningMessageChunk,
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

interface MessageUpdateOptions {
    create: () => MessageData;
    update: (message: MessageData) => MessageData;
}

function createThreadListUpdate(threadUuid: string, messageUuid: string, options: MessageUpdateOptions) {
    return (threads: MessageThreadData[]): MessageThreadData[] => {
        const {create, update} = options;
        const threadIndex = threads.findIndex(v => v.uuid === threadUuid);

        if (threadIndex < 0) {
            return threads;
        }

        const targetThread = threads[threadIndex];

        const roundtripIndex = targetThread.roundtrips.findIndex(v => v.messages.some(v => v.uuid === messageUuid));

        if (roundtripIndex < 0) {
            return threads;
        }

        const targetRoundtrip = targetThread.roundtrips[roundtripIndex];

        const messageIndex = targetRoundtrip.messages.findIndex(v => v.uuid === messageUuid);

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
                            messages: [
                                ...targetRoundtrip.messages,
                                update(newMessage),
                            ],
                        },
                        ...targetThread.roundtrips.slice(roundtripIndex + 1),
                    ],
                },
                ...threads.slice(threadIndex + 1),
            ];
        }

        const targetMessage = targetRoundtrip.messages[messageIndex];
        return [
            ...threads.slice(0, threadIndex),
            {
                ...targetThread,
                roundtrips: [
                    ...targetThread.roundtrips.slice(0, roundtripIndex),
                    {
                        ...targetRoundtrip,
                        messages: [
                            ...targetRoundtrip.messages.slice(0, messageIndex),
                            update(targetMessage),
                            ...targetRoundtrip.messages.slice(messageIndex + 1),
                        ],
                    },
                    ...targetThread.roundtrips.slice(roundtripIndex + 1),
                ],
            },
            ...threads.slice(threadIndex + 1),
        ];
    };
}

type AssistantMessageData = AssistantTextMessageData | ToolCallMessageData;

type MaybeChunk = MessageContentChunk | undefined;

function assertThinkingChunk(chunk: MaybeChunk, message: string): asserts chunk is ThinkingMessageChunk {
    if (chunk?.type !== 'thinking') {
        throw new Error(message);
    }
}

function assertToolCallChunk(chunk: MaybeChunk, message: string): asserts chunk is ToolCallMessageChunk {
    if (chunk?.type !== 'toolCall') {
        throw new Error(message);
    }
}

function handleChunkToAssistantMessage(message: AssistantMessageData, chunk: MessageInputChunk): MessageData {
    // Reasoning chunk should be unique and on top of all chunks
    if (chunk.type === 'reasoning') {
        return {
            ...message,
            chunks: updateItemInArray<MessageContentChunk, ReasoningMessageChunk>(
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

    if (chunk.type === 'textInTool') {
        return message;
    }

    if (chunk.type === 'thinkingStart') {
        return {
            ...message,
            chunks: [
                ...message.chunks,
                {type: 'thinking', content: '', status: 'generating'},
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

    const lastChunk = message.chunks.at(-1);

    if (chunk.type === 'thinkingDelta') {
        assertThinkingChunk(lastChunk, 'Unexpected thinking delta chunk coming without a start chunk');
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
    else if (chunk.type === 'thinkingEnd') {
        assertThinkingChunk(lastChunk, 'Unexpected thinking end chunk coming without a start chunk');
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
    else {
        assertNever<{type: string}>(chunk, v => `Unknown chunk type: ${v.type}`);
    }
}

function appendMessageBy(threadUuid: string, messageUuid: string, chunk: MessageInputChunk) {
    return createThreadListUpdate(
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
                if (message.type === 'assistantText' || message.type === 'toolCall') {
                    return handleChunkToAssistantMessage(message, chunk);
                }

                if (chunk.type !== 'text') {
                    throw new Error('User message should only receive text chunk');
                }

                if (message.type === 'debug') {
                    throw new Error('Debug message should not receive any dynamic chunk');
                }

                return {
                    ...message,
                    content: message.content + chunk.content,
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
            threadUuid,
            uuid,
            body: {
                type: 'text',
                content: content,
            },
        };
        for await (const chunk of ipc.kernel.callStreaming(uuid, 'inboxSendMessage', request)) {
            setMessageThreadList(appendMessageBy(threadUuid, chunk.replyUuid, chunk.value));
        }
    };
}
