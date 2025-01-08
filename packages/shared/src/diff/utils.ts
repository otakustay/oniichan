export interface Change {
    type: 'delete' | 'insert' | 'normal';
    content: string;
}

export interface Hunk {
    changes: Change[];
}

interface OrganizedHunk {
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

    for (const change of hunk.changes.slice(result.head.length, -result.tail.length)) {
        result.body.push(change);
        switch (change.type) {
            case 'delete':
                result.deletedCount++;
                result.oldBody.push(change);
                break;
            case 'insert':
                result.insertedCount++;
                result.newBody.unshift(change);
                break;
            default:
                result.oldBody.push(change);
                result.newBody.push(change);
                break;
        }
    }

    return result;
}
