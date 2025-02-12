import {applyPatch} from './apply';
import {parsePatchString} from './parse';

export interface PatchResult {
    newContent: string;
    deletedCount: number;
    insertedCount: number;
}

export function patchContent(content: string, patch: string): PatchResult {
    const patches = parsePatchString(patch);
    return {
        newContent: applyPatch(content, patches),
        deletedCount: patches.reduce((sum, v) => sum + v.search.length, 0),
        insertedCount: patches.reduce((sum, v) => sum + v.replace.length, 0),
    };
}
