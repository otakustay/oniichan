import {parseDiffText} from './parse';
import {applyHunks} from './apply';
import {organizeHunk} from './utils';
import {assertNever} from '../error';

export interface DiffSummary {
    deletedCount: number;
    insertedCount: number;
}

export function summarizeDiff(diff: string): DiffSummary {
    const hunks = parseDiffText(diff);
    const result: DiffSummary = {
        deletedCount: 0,
        insertedCount: 0,
    };
    for (const hunk of hunks) {
        const {deletedCount, insertedCount} = organizeHunk(hunk);
        result.deletedCount += deletedCount;
        result.insertedCount += insertedCount;
    }
    return result;
}

export type DiffAction = 'create' | 'diff' | 'delete';

export function applyDiff(source: string, action: DiffAction, input: string): string {
    switch (action) {
        case 'create':
            return input;
        case 'delete':
            return '';
        case 'diff':
            return applyHunks(source, parseDiffText(input));
        default:
            assertNever<string>(action, v => `Unknown diff action ${v}`);
    }
}
