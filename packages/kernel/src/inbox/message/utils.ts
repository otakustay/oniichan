import {assertNever} from '@oniichan/shared/error';
import type {MessageData, MessageViewChunk} from '@oniichan/shared/inbox';
import {isContentfulChunk, chunkToString} from '@oniichan/shared/inbox';
import type {InboxRoundtrip} from '../interface.js';
import {AssistantTextMessage} from './assistantText.js';
import {ToolCallMessage} from './toolCall.js';
import {ToolUseMessage} from './toolUse.js';
import {UserRequestMessage} from './userRequest.js';

export function chunksToModelText(chunks: MessageViewChunk[]) {
    return chunks.filter(isContentfulChunk).map(chunkToString).join('');
}

export type Message = UserRequestMessage | AssistantTextMessage | ToolCallMessage | ToolUseMessage;

export function deserializeMessage(data: MessageData, roundtrip: InboxRoundtrip): Message {
    switch (data.type) {
        case 'userRequest':
            return UserRequestMessage.from(data, roundtrip);
        case 'assistantText':
            return AssistantTextMessage.from(data, roundtrip);
        case 'toolCall':
            return ToolCallMessage.from(data, roundtrip);
        case 'toolUse':
            return ToolUseMessage.from(data, roundtrip);
        default:
            assertNever<{type: string}>(data, v => `Unknown message type ${v.type}`);
    }
}
