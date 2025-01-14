export interface Change {
    type: 'delete' | 'insert' | 'normal';
    content: string;
}

export interface Hunk {
    changes: Change[];
}

export interface OrganizedHunk {
    head: Change[];
    tail: Change[];
    body: Change[];
    oldBody: Change[];
    newBody: Change[];
    deletedCount: number;
    insertedCount: number;
}

export function organizeHunk(hunk: Hunk): OrganizedHunk {
    const result: OrganizedHunk = {
        head: [],
        tail: [],
        body: [],
        oldBody: [],
        newBody: [],
        deletedCount: 0,
        insertedCount: 0,
    };

    for (const change of hunk.changes) {
        if (change.type !== 'normal') {
            break;
        }
        result.head.push(change);
    }

    for (const change of hunk.changes.slice(result.head.length).reverse()) {
        if (change.type !== 'normal') {
            break;
        }
        result.tail.unshift(change);
    }

    // `result.tail.length` can be `0`, don't slice `hunk.changes` to empty array
    for (const change of hunk.changes.slice(result.head.length, -result.tail.length || undefined)) {
        result.body.push(change);
        switch (change.type) {
            case 'delete':
                result.deletedCount++;
                result.oldBody.push(change);
                break;
            case 'insert':
                result.insertedCount++;
                result.newBody.push(change);
                break;
            default:
                result.oldBody.push(change);
                result.newBody.push(change);
                break;
        }
    }

    return result;
}

function looseLineEqual(left: string, right: string) {
    return left === right || left.trim() === right.trim();
}

export function looseLocateLines(source: string[], target: string[], start: number) {
    const startingLine = target.at(0);

    if (typeof startingLine !== 'string') {
        return -1;
    }

    if (!isContentRich(target)) {
        return -1;
    }

    const followingLinesCount = target.length - 1;
    const followingLinesInTarget = target.slice(1);
    for (let i = start; i < source.length - followingLinesCount; i++) {
        const line = source[i];
        if (looseLineEqual(line, startingLine)) {
            const followingLinesInSource = source.slice(i + 1, i + 1 + followingLinesCount);
            if (followingLinesInSource.every((v, i) => looseLineEqual(v, followingLinesInTarget[i]))) {
                return i;
            }
        }
    }

    return -1;
}

export function isContentRich(changes: string[] | Change[]) {
    if (changes.length < 2) {
        return false;
    }

    // A line is rich if it contains any identifier
    const matched = changes.filter(v => /[a-zA-Z0-9]/.test(typeof v === 'string' ? v : v.content));
    // We need at least 2 lines with rich content to match source code
    return matched.length >= 2;
}
