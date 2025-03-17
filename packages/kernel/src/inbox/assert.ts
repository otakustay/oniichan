import type {ToolName} from '@oniichan/shared/tool';
import type {InboxAssistantMessage, InboxAssistantTextMessage, InboxMessage, InboxToolCallMessage} from './interface';
import type {ParsedToolCallMessageChunk, ParsedToolCallMessageChunkOf} from '@oniichan/shared/inbox';

// Shorten some types to ensure all declaration can be placed in one line
type Message = InboxMessage;
type AssistantMessage = InboxAssistantMessage;
type AssistantTextMessage = InboxAssistantTextMessage;
type ToolCallMessage<N extends ToolName = ToolName> = InboxToolCallMessage<N>;
type AnyChunk = ParsedToolCallMessageChunk;
type ChunkOf<N extends ToolName> = ParsedToolCallMessageChunkOf<N>;

export function assertAssistantTextMessage(message: Message): asserts message is AssistantTextMessage {
    if (message.type !== 'assistantText') {
        throw new Error('Message is not assistant text');
    }
}

export function assertToolCallMessage(message: Message): asserts message is ToolCallMessage {
    if (message.type !== 'toolCall') {
        throw new Error('Message is not tool call');
    }
}

export function assertToolCallType<N extends ToolName>(chunk: AnyChunk, tool: N): asserts chunk is ChunkOf<N> {
    if (chunk.toolName !== tool) {
        throw new Error(`Unexpected tool call chunk in message with type ${tool}`);
    }
}

export function isAssistantMessage(message: Message): message is AssistantMessage {
    return message.type === 'assistantText' || message.type === 'toolCall';
}

export function isToolCallMessage(message: Message): message is ToolCallMessage {
    return message.type === 'toolCall';
}

export function isToolCallMessageOf<N extends ToolName>(message: Message, tool: N): message is ToolCallMessage<N> {
    return isToolCallMessage(message) && message.findToolCallChunkStrict().toolName === tool;
}
