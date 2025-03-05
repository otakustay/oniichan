import {ToolName} from '@oniichan/shared/tool';
import {
    InboxAssistantMessage,
    InboxAssistantTextMessage,
    InboxMessage,
    InboxPlanMessage,
    InboxToolCallMessage,
} from './interface';

export function assertAssistantTextMessage(message: InboxMessage): asserts message is InboxAssistantTextMessage {
    if (message.type !== 'assistantText') {
        throw new Error('Message is not assistant text');
    }
}

export function assertToolCallMessage(message: InboxMessage): asserts message is InboxToolCallMessage {
    if (message.type !== 'toolCall') {
        throw new Error('Message is not tool call');
    }
}

export function assertPlanMessage(message: InboxMessage): asserts message is InboxPlanMessage {
    if (message.type !== 'plan') {
        throw new Error('Message is not plan');
    }
}

export function isAssistantMessage(message: InboxMessage): message is InboxAssistantMessage {
    return message.type === 'assistantText' || message.type === 'toolCall' || message.type === 'plan';
}

export function isToolCallMessage(message: InboxMessage): message is InboxToolCallMessage {
    return message.type === 'toolCall';
}

export function isToolCallMessageOf(message: InboxMessage, tool: ToolName): message is InboxToolCallMessage {
    return isToolCallMessage(message) && message.findToolCallChunkStrict().toolName === tool;
}
