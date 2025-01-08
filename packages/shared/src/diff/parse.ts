import {Change, Hunk} from './utils';

// Some diff may be in format like `@@ ... @@ [next line]`,
// we are not going to handle this case because there will be enough context lines inside a hunk,
// it's not a big problem losing one line of context (which is placed after `@@`)
function isHunkStart(line: string) {
    return /^\s*@@[\s.]+@@/.test(line.trim());
}

export function parseDiffText(diff: string): Hunk[] {
    const hunks: Hunk[] = [];
    const lines = diff.replace(/\n+$/, '').split('\n');
    const getCurrentHunk = () => {
        const currentHunk = hunks.at(-1);

        if (currentHunk) {
            return currentHunk;
        }

        const newHunk = {changes: []};
        hunks.push(newHunk);
        return newHunk;
    };

    for (const line of lines) {
        if (isHunkStart(line)) {
            hunks.push({changes: []});
        }
        else {
            const hunk = getCurrentHunk();
            const change: Change = {
                type: line.startsWith('-') ? 'delete' : line.startsWith('+') ? 'insert' : 'normal',
                content: line.replace(/^[+\- ]/, ''),
            };
            hunk.changes.push(change);
        }
    }

    return hunks;
}
