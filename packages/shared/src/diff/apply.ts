import {applyPatch, ParsedDiff} from 'diff';
import {Change, Hunk, OrganizedHunk, organizeHunk} from './utils';
import {looseLocateLines} from './utils';

function changeToLine(change: Change) {
    const prefix = change.type === 'delete' ? '-' : change.type === 'insert' ? '+' : ' ';
    return prefix + change.content;
}

function applySingleHunk(source: string, organized: OrganizedHunk): string {
    const {head, tail, body, oldBody, newBody} = organized;
    const sourceLines = source.split('\n');
    const oldLines = [...head, ...oldBody, ...tail].map(v => v.content);
    const startLine = looseLocateLines(sourceLines, oldLines);

    if (startLine < 0) {
        if (head.length) {
            return applySingleHunk(source, {...organized, head: []});
        }
        if (tail.length) {
            return applySingleHunk(source, {...organized, tail: []});
        }
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
    return hunks.reduce((result, hunk) => applySingleHunk(result, organizeHunk(hunk)), source);
}
