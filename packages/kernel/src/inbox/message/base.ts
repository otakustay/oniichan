import {now} from '@oniichan/shared/string';
import type {MessageType, MessageData, MessageDataBase} from '@oniichan/shared/inbox';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {InboxMessageBase, InboxRoundtrip} from '../interface.js';

export abstract class MessageBase<T extends MessageType> implements InboxMessageBase<T> {
    readonly uuid: string;

    readonly type: T;

    protected readonly roundtrip: InboxRoundtrip;

    private createdAt = now();

    private error: string | undefined = undefined;

    constructor(uuid: string, type: T, roundtrip: InboxRoundtrip) {
        this.uuid = uuid;
        this.type = type;
        this.roundtrip = roundtrip;
    }

    getRoundtrip() {
        return this.roundtrip;
    }

    setError(reason: string) {
        this.error = reason;
    }

    protected restore(persistData: MessageData) {
        this.createdAt = persistData.createdAt;
        this.error = persistData.error;
    }

    abstract toMessageData(): MessageData;

    abstract toChatInputPayload(): ChatInputPayload;

    protected toMessageDataBase(): MessageDataBase {
        return {
            uuid: this.uuid,
            createdAt: this.createdAt,
            error: this.error,
        };
    }
}
