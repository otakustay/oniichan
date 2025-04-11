import type {AssistantMessageData, UserRequestMessageData} from './message';
import type {RoundtripData, RoundtripStatus} from './roundtrip';

export type MessageThreadWorkingMode = 'normal' | 'ringRing' | 'couple' | 'henshin';

export interface RoundtripMessageData {
    status: RoundtripStatus;
    request: UserRequestMessageData;
    responses: AssistantMessageData[];
}

export interface MessageThreadData {
    uuid: string;
    workingMode: MessageThreadWorkingMode;
    roundtrips: RoundtripMessageData[];
}

export interface MessageThreadPersistData {
    uuid: string;
    workingMode: MessageThreadWorkingMode;
    roundtrips: RoundtripData[];
}
