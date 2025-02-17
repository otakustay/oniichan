import {FileEditResult} from '@oniichan/shared/inbox';

export interface MessageRoundrip {
    getEditStackForFile(file: string): FileEditResult[];
}
