import {MessageData} from './message';
import {RoundtripData, RoundtripStatus} from './roundtrip';

export interface RoundtripMessageData {
    status: RoundtripStatus;
    messages: MessageData[];
}

export interface MessageThreadData {
    uuid: string;
    roundtrips: RoundtripMessageData[];
}

export interface MessageThreadPersistData {
    uuid: string;
    roundtrips: RoundtripData[];
}
