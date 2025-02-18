import {FileEditData} from '@oniichan/shared/patch';

export interface MessageRoundrip {
    getEditStackForFile(file: string): FileEditData[];
}
