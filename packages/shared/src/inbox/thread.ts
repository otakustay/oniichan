import type {AssistantMessageData, UserRequestMessageData} from './message.js';
import type {RoundtripData, RoundtripStatus} from './roundtrip.js';

export type MessageThreadWorkingMode = 'normal' | 'ringRing' | 'couple' | 'henshin' | 'senpai';

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
