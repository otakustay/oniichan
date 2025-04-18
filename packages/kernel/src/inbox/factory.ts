import {newUuid} from '@oniichan/shared/id';
import type {
    AssistantTextMessageContentChunk,
    ToolCallMessageContentChunk,
    ParsedToolCallMessageChunk,
    ToolCallMessageData,
} from '@oniichan/shared/inbox';
import type {
    InboxRoundtrip,
    InboxToolUseMessage,
    InboxAssistantTextMessage,
    InboxToolCallMessage,
    InboxMessageThread,
    InboxUserRequestMessage,
} from './interface';
import {ToolUseMessage, AssistantTextMessage, ToolCallMessage, UserRequestMessage} from './message';
import {Roundtrip} from './roundtrip';
import {MessageThread} from './thread';

export function setRoundtripRequest(roundtrip: InboxRoundtrip, uuid: string, content: string): InboxUserRequestMessage {
    const message = new UserRequestMessage(uuid, roundtrip, content);
    roundtrip.setRequest(message);
    return message;
}

export function createDetachedUserRequestMessage(content: string): InboxUserRequestMessage {
    const roundtrip = createEmptyRoundtrip();
    return setRoundtripRequest(roundtrip, newUuid(), content);
}

export function createToolUseMessage(roundtrip: InboxRoundtrip, content: string): InboxToolUseMessage {
    return new ToolUseMessage(newUuid(), roundtrip, content);
}

export function createEmptyAssistantTextMessage(roundtrip: InboxRoundtrip): InboxAssistantTextMessage {
    return new AssistantTextMessage(newUuid(), 'standalone', roundtrip);
}

export function transferToToolCallMessage(source: InboxAssistantTextMessage, args: unknown): InboxToolCallMessage {
    const textMessageData = source.toMessageData();
    const transformChunk = (chunk: AssistantTextMessageContentChunk): ToolCallMessageContentChunk | [] => {
        if (chunk.type === 'toolCall') {
            return {
                ...chunk,
                type: 'parsedToolCall',
                status: 'waitingApprove',
                arguments: args,
            } as unknown as ParsedToolCallMessageChunk;
        }
        return chunk;
    };
    const toolCallMessageData: ToolCallMessageData = {
        ...textMessageData,
        type: 'toolCall',
        chunks: textMessageData.chunks.flatMap(transformChunk),
    };
    return new ToolCallMessage(source.getRoundtrip(), toolCallMessageData);
}

export function createEmptyRoundtrip(): InboxRoundtrip {
    return new Roundtrip();
}

export function createEmptyMessageThread(): InboxMessageThread {
    return new MessageThread(newUuid(), 'normal');
}
