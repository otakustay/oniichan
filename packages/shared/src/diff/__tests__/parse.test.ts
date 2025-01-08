import path from 'node:path';
import fs from 'node:fs/promises';
import {test, expect} from 'vitest';
import {parseDiffText} from '../parse';
import {Hunk} from '../utils';

async function readDiffText(name: string) {
    return fs.readFile(path.join(__dirname, 'fixtures', name, 'diff.txt'), 'utf-8');
}

async function readExpectedDiff(name: string): Promise<Hunk[]> {
    const content = await fs.readFile(path.join(__dirname, 'fixtures', name, 'diff.json'), 'utf-8');
    return JSON.parse(content) as Hunk[];
}

test('single hunk', async () => {
    const diffText = await readDiffText('single-hunk');
    const expected = await readExpectedDiff('single-hunk');
    const hunks = parseDiffText(diffText);
    expect(hunks).toEqual(expected);
});

test('multiple hunks', async () => {
    const diffText = await readDiffText('multiple-hunks');
    const expected = await readExpectedDiff('multiple-hunks');
    const hunks = parseDiffText(diffText);
    expect(hunks).toEqual(expected);
});
