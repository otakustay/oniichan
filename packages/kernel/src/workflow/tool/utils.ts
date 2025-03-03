import {InboxAssistantTextMessage, InboxMessage, InboxToolCallMessage} from '../../inbox';

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

export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
