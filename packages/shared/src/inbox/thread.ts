import type {AssistantMessageData, UserRequestMessageData} from './message';
import type {RoundtripData, RoundtripStatus} from './roundtrip';

export interface RoundtripMessageData {
    status: RoundtripStatus;
    request: UserRequestMessageData;
    responses: AssistantMessageData[];
}

export interface MessageThreadData {
    uuid: string;
    roundtrips: RoundtripMessageData[];
}

export interface MessageThreadPersistData {
    uuid: string;
    roundtrips: RoundtripData[];
}
