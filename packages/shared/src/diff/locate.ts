function looseLineEqual(left: string, right: string) {
    return left === right || left.trim() === right.trim();
}

export function looseLocateLines(source: string[], target: string[], start: number) {
    const startingLine = target.at(0);

    if (typeof startingLine !== 'string') {
        return -1;
    }

    const followingLinesCount = target.length - 1;
    const followingLinesInTarget = target.slice(1);
    for (const [i, line] of source.slice(start).entries()) {
        if (looseLineEqual(line, startingLine)) {
            const followingLinesInSource = source.slice(i + 1, followingLinesCount);
            if (followingLinesInSource.every((v, i) => looseLineEqual(v, followingLinesInTarget[i]))) {
                return i;
            }
        }
    }

    return -1;
}
