import {applyPatch} from './apply';
import {parsePatchString} from './parse';

export interface PatchResult {
    newContent: string;
    deletedCount: number;
    insertedCount: number;
}

export function patchContent(content: string, patch: string): PatchResult {
    const patches = parsePatchString(patch);
    const {deletedCount, insertedCount} = patches.reduce(
        (result, patch) => {
            const deleted = patch.search.filter(v => !patch.replace.includes(v));
            const inserted = patch.replace.filter(v => !patch.search.includes(v));

            return {
                deletedCount: result.deletedCount + deleted.length,
                insertedCount: result.insertedCount + inserted.length,
            };
        },
        {deletedCount: 0, insertedCount: 0}
    );
    return {
        newContent: applyPatch(content, patches),
        deletedCount,
        insertedCount,
    };
}
