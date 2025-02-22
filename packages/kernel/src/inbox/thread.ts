import {MessageThreadData, MessageThreadPersistData, RoundtripMessageData} from '@oniichan/shared/inbox';
import {Roundtrip} from './roundtrip';

/**
 * A thread is a collection of roundtrips, this includes one or more user requests.
 */
export class MessageThread {
    static from(data: MessageThreadPersistData) {
        const thread = new MessageThread(data.uuid);
        for (const roundtripData of data.roundtrips) {
            thread.addRoundtrip(Roundtrip.from(roundtripData));
        }
        return thread;
    }

    public readonly uuid: string;

    private readonly roundtrips: Roundtrip[] = [];

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    addRoundtrip(roundtrip: Roundtrip) {
        this.roundtrips.push(roundtrip);
    }

    hasMessage(messageUuid: string) {
        return this.roundtrips.some(v => v.hasMessage(messageUuid));
    }

    findMessageByUuidStrict(messageUuid: string) {
        for (const roundtrip of this.roundtrips) {
            const message = roundtrip.findMessageByUuid(messageUuid);
            if (message) {
                return message;
            }
        }

        throw new Error(`Message ${messageUuid} not found in thread ${this.uuid}`);
    }

    findRoundtripByMessageUuidStrict(messageUuid: string) {
        const roundtrip = this.roundtrips.find(v => v.hasMessage(messageUuid));

        if (!roundtrip) {
            throw new Error(`No roundtrip found for message ${messageUuid}`);
        }

        return roundtrip;
    }

    toMessages() {
        return this.roundtrips.flatMap(v => v.toMessages());
    }

    toThreadData(): MessageThreadData {
        const roundtripToData = (roundtrip: Roundtrip): RoundtripMessageData => {
            return {
                status: roundtrip.getStatus(),
                messages: roundtrip.toMessages(true).map(v => v.toMessageData()),
            };
        };
        return {
            uuid: this.uuid,
            roundtrips: this.roundtrips.map(roundtripToData),
        };
    }

    toPersistData(): MessageThreadPersistData {
        return {
            uuid: this.uuid,
            roundtrips: this.roundtrips.map(v => v.toRoundtripData()),
        };
    }
}
