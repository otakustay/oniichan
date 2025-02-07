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

async function readHunks(name: string): Promise<Hunk[]> {
    const content = await fs.readFile(path.join(__dirname, 'fixtures', name, 'diff.json'), 'utf-8');
    return JSON.parse(content) as Hunk[];
}

test('single hunk', async () => {
    const oldText = await readOldText('single-hunk');
    const hunks = await readHunks('single-hunk');
    const expected = await readNewText('single-hunk');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('multiple hunks', async () => {
    const oldText = await readOldText('multiple-hunks');
    const hunks = await readHunks('multiple-hunks');
    const expected = await readNewText('multiple-hunks');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('context wrong', async () => {
    const oldText = await readOldText('context-wrong');
    const hunks = await readHunks('context-wrong');
    const expected = await readNewText('context-wrong');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('not locatable', async () => {
    const oldText = await readOldText('not-locatable');
    const hunks = await readHunks('not-locatable');
    expect(() => applyHunks(oldText, hunks)).toThrow();
});

test('deleted unmatch', async () => {
    const oldText = await readOldText('deleted-unmatch');
    const hunks = await readHunks('deleted-unmatch');
    const expected = await readNewText('deleted-unmatch');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('no diff hunk', async () => {
    const oldText = await readOldText('no-diff-hunk');
    const hunks = await readHunks('no-diff-hunk');
    const expected = await readNewText('no-diff-hunk');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('full replace', async () => {
    const oldText = await readOldText('full-replace');
    const hunks = await readHunks('full-replace');
    const expected = await readNewText('full-replace');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});

test('empty hunk', async () => {
    const oldText = await readOldText('empty-hunk');
    const hunks = await readHunks('empty-hunk');
    const expected = await readNewText('empty-hunk');
    const newText = applyHunks(oldText, hunks);
    expect(newText).toBe(expected);
});
