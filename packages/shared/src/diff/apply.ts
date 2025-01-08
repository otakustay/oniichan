import {applyPatch, ParsedDiff} from 'diff';
import {Change, Hunk, organizeHunk} from './utils';
import {looseLocateLines} from './locate';

function changeToLine(change: Change) {
    const prefix = change.type === 'delete' ? '-' : change.type === 'insert' ? '+' : ' ';
    return prefix + change.content;
}

function applySingleHunk(source: string, hunk: Hunk): string {
    const {head, tail, body, oldBody, newBody} = organizeHunk(hunk);
    const sourceLines = source.split('\n');
    const oldLines = [...head, ...body, ...tail].map(v => v.content);
    const startLine = looseLocateLines(sourceLines, oldLines, 0);

    if (startLine < 0) {
        throw new Error('Unable to locate hunk in source');
    }

    const parsed: ParsedDiff = {
        hunks: [
            {
                oldStart: startLine + head.length + 1,
                oldLines: oldBody.length,
                newStart: startLine + head.length + 1,
                newLines: newBody.length,
                lines: body.map(changeToLine),
            },
        ],
    };
    const result = applyPatch(source, parsed);

    if (result === false) {
        throw new Error('Unable to apply patch');
    }

    return result;
}

export function applyHunks(source: string, hunks: Hunk[]): string {
    return hunks.reduce((result, hunk) => applySingleHunk(result, hunk), source);
}
