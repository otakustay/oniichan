import {Hunk, isContentRich, looseLocateLines, OrganizedHunk, organizeHunk} from './utils';

function replace(source: string[], locateStart: number, organized: OrganizedHunk): string {
    const {head, oldBody, newBody} = organized;
    const resultLines = [
        ...source.slice(0, locateStart + head.length),
        ...newBody.map(v => v.content),
        ...source.slice(locateStart + head.length + oldBody.length),
    ];
    return resultLines.join('\n');
}

function applySingleHunk(source: string, organized: OrganizedHunk): string {
    const {head, tail, body, oldBody} = organized;
    const sourceLines = source.split('\n');
    const headLines = head.map(v => v.content);
    const bodyLines = oldBody.map(v => v.content);
    const tailLines = tail.map(v => v.content);
    const startLine = looseLocateLines(sourceLines, [...headLines, ...bodyLines, ...tailLines], 0);

    if (startLine >= 0) {
        return replace(sourceLines, startLine, organized);
    }

    // Less accurate match, if head and tail context are matched, and lines count between them is as expected, we pass
    if (isContentRich(head) && isContentRich(tail)) {
        const headStartLine = looseLocateLines(sourceLines, headLines, 0);
        const containsHead = headStartLine >= 0;
        const tailStartLine = containsHead
            ? looseLocateLines(sourceLines, tailLines, headStartLine + headLines.length)
            : -1;
        const containsTail = tailStartLine >= 0;
        const bodyLinesCountInSource = tailStartLine - headStartLine - headLines.length;
        if (containsHead && containsTail && bodyLinesCountInSource === body.length) {
            return replace(sourceLines, headStartLine, organized);
        }
    }

    // Fallback to match without head or tail
    if (tail.length) {
        return applySingleHunk(source, {...organized, tail: []});
    }
    if (head.length) {
        return applySingleHunk(source, {...organized, head: []});
    }

    // T_T
    throw new Error('Unable to locate patch in source');
}

export function applyHunks(source: string, hunks: Hunk[]): string {
    const hasChangeHunks = hunks.filter(v => !!v.changes.length);
    return hasChangeHunks.reduce((result, hunk) => applySingleHunk(result, organizeHunk(hunk)), source);
}
