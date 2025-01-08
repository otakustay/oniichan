import path from 'node:path';
import fs from 'node:fs/promises';
import {test, expect} from 'vitest';
import {applyHunks} from '../apply';
import {Hunk} from '../utils';

async function readOldText(name: string) {
    return fs.readFile(path.join(__dirname, 'fixtures', name, 'old.txt'), 'utf-8');
}

async function readNewText(name: string) {
    return fs.readFile(path.join(__dirname, 'fixtures', name, 'new.txt'), 'utf-8');
}

async function readExpectedDiff(name: string): Promise<Hunk[]> {
    const content = await fs.readFile(path.join(__dirname, 'fixtures', name, 'diff.json'), 'utf-8');
    return JSON.parse(content) as Hunk[];
}

test('single hunk', async () => {
    const oldText = await readOldText('single-hunk');
    const hunks = await readExpectedDiff('single-hunk');
    const expected = await readNewText('single-hunk');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('multiple hunks', async () => {
    const oldText = await readOldText('multiple-hunks');
    const hunks = await readExpectedDiff('multiple-hunks');
    const expected = await readNewText('multiple-hunks');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});
