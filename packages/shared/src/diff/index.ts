import {parseDiffText} from './parse';
import {applyHunks} from './apply';
import {organizeHunk, Hunk} from './utils';
import {assertNever} from '../error';

export interface DiffSummary {
    deletedCount: number;
    insertedCount: number;
}

export function summarizeDiff(action: DiffAction, source: string, input: string): DiffSummary {
    if (action === 'create') {
        return {
            deletedCount: input.split('\n').length,
            insertedCount: 0,
        };
    }
    if (action === 'delete') {
        return {
            deletedCount: source.split('\n').length,
            insertedCount: 0,
        };
    }
    if (action === 'diff') {
        const hunks = parseDiffText(input);
        return summarize(hunks);
    }

    assertNever<string>(action, v => `Unknown diff action ${v}`);
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

export interface DiffResult extends DiffSummary {
    success: boolean;
    newContent: string;
}

export function applyDiff(action: DiffAction, source: string, input: string): DiffResult {
    if (action === 'create') {
        return {
            success: true,
            newContent: input,
            insertedCount: input.split('\n').length,
            deletedCount: 0,
        };
    }
    if (action === 'delete') {
        return {
            success: true,
            newContent: '',
            insertedCount: 0,
            deletedCount: source.split('\n').length,
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
                insertedCount: insertedCount,
                deletedCount: deletedCount,
            };
        }
        catch {
            return {
                success: false,
                newContent: '',
                insertedCount: insertedCount,
                deletedCount: deletedCount,
            };
        }
    }

    assertNever<string>(action, v => `Unknown diff action ${v}`);
}
