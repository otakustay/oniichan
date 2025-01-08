import {parseDiffText} from './parse';
import {applyHunks} from './apply';
import {organizeHunk, Hunk} from './utils';
import {assertNever} from '../error';

export interface DiffSummary {
    deletedCount: number;
    insertedCount: number;
}

function summarize(hunks: Hunk[]): DiffSummary {
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

export interface DiffResult {
    success: boolean;
    newContent: string;
    addition: number;
    deletion: number;
}

export function applyDiff(action: DiffAction, source: string, input: string): DiffResult {
    if (action === 'create') {
        return {
            success: true,
            newContent: input,
            addition: input.split('\n').length,
            deletion: 0,
        };
    }
    if (action === 'delete') {
        return {
            success: true,
            newContent: '',
            addition: 0,
            deletion: source.split('\n').length,
        };
    }
    if (action === 'diff') {
        const hunks = parseDiffText(input);
        const {insertedCount, deletedCount} = summarize(hunks);
        try {
            const newContent = applyHunks(source, hunks);
            return {
                success: true,
                newContent,
                addition: insertedCount,
                deletion: deletedCount,
            };
        }
        catch {
            return {
                success: false,
                newContent: '',
                addition: insertedCount,
                deletion: deletedCount,
            };
        }
    }

    assertNever<string>(action, v => `Unknown diff action ${v}`);
}
