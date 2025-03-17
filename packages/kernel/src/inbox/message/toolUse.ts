import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolUseMessageData} from '@oniichan/shared/inbox';
import type {InboxRoundtrip, InboxToolUseMessage} from '../interface';
import {MessageBase} from './base';

export class ToolUseMessage extends MessageBase<'toolUse'> implements InboxToolUseMessage {
    static from(data: ToolUseMessageData, roundtrip: InboxRoundtrip) {
        const message = new ToolUseMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: InboxRoundtrip, content: string) {
        super(uuid, 'toolUse', roundtrip);
        this.content = content;
    }

    toMessageData(): ToolUseMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            content: this.content,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'user',
            content: this.content,
        };
    }
}