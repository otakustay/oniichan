import type {ChatInputPayload} from '@oniichan/shared/model';
import type {UserRequestMessageData} from '@oniichan/shared/inbox';
import type {InboxRoundtrip, InboxUserRequestMessage, UserRequestMessageToChatInpytPayloadOptions} from '../interface.js';
import {MessageBase} from './base.js';

export class UserRequestMessage extends MessageBase<'userRequest'> implements InboxUserRequestMessage {
    static from(data: UserRequestMessageData, roundtrip: InboxRoundtrip) {
        const message = new UserRequestMessage(data.uuid, roundtrip, data.content);
        message.restore(data);
        return message;
    }

    readonly content: string;

    constructor(uuid: string, roundtrip: InboxRoundtrip, content: string) {
        super(uuid, 'userRequest', roundtrip);
        this.content = content;
    }

    toMessageData(): UserRequestMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            content: this.content,
        };
    }

    toChatInputPayload(options?: UserRequestMessageToChatInpytPayloadOptions): ChatInputPayload {
        return {
            role: 'user',
            content: options?.hideUserRequest ? '(User request is currently hidden)' : this.content,
        };
    }
}
