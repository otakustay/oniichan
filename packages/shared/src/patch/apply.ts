import {ParsedPatch} from './parse';

function strictLineEqual(left: string, right: string) {
    return left === right;
}

function looseLineEqual(left: string, right: string) {
    return left === right || left.trim() === right.trim();
}

function isContentRich(changes: string[]) {
    // A line is rich if it contains any identifier
    const matched = changes.filter(v => /[a-zA-Z0-9]/.test(v));
    // We need at least 2 lines with rich content to match source code
    return matched.length >= changes.length || matched.length >= 2;
}

function locateLines(source: string[], target: string[]) {
    const startingLine = target.at(0);

    if (typeof startingLine !== 'string') {
        return -1;
    }

    const lineEqual = isContentRich(target) ? looseLineEqual : strictLineEqual;

    const followingLinesCount = target.length - 1;
    const followingLinesInTarget = target.slice(1);
    for (let i = 0; i < source.length - followingLinesCount; i++) {
        const line = source[i];
        if (lineEqual(line, startingLine)) {
            const followingLinesInSource = source.slice(i + 1, i + 1 + followingLinesCount);
            if (followingLinesInSource.every((v, i) => lineEqual(v, followingLinesInTarget[i]))) {
                return i;
            }
        }
    }

    return -1;
}

function applySinglePatch(oldLines: string[], patch: ParsedPatch): string[] {
    const index = locateLines(oldLines, patch.search);

    if (index < 0) {
        throw new Error('Search content not found');
    }

    return [
        ...oldLines.slice(0, index),
        ...patch.replace,
        ...oldLines.slice(index + patch.search.length),
    ];
}

export function applyPatch(oldContent: string, patches: ParsedPatch[]): string {
    const lines = oldContent.split('\n');
    const patchedLines = patches.reduce((content, patch) => applySinglePatch(content, patch), lines);
    return patchedLines.join('\n');
}
