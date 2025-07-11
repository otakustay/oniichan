import path from 'node:path';
import fs from 'node:fs/promises';
import {test, expect} from 'vitest';
import {patchContent} from '../patch.js';

async function readFixture(name: string) {
    const files = ['old.txt', 'new.txt', 'patch.txt'].map(v => path.join(__dirname, 'fixtures', name, v));
    const [oldContent, newContent, patch] = await Promise.all(files.map(v => fs.readFile(v, 'utf-8')));
    return {oldContent, newContent, patch};
}

test('delete code', async () => {
    const {oldContent, newContent, patch} = await readFixture('delete-code');
    const patched = patchContent(oldContent, patch);
    expect(patched.newContent).toBe(newContent);
});

test('full replace', async () => {
    const {oldContent, newContent, patch} = await readFixture('full-replace');
    const patched = patchContent(oldContent, patch);
    expect(patched.newContent).toBe(newContent);
});

test('replace code', async () => {
    const {oldContent, newContent, patch} = await readFixture('replace-code');
    const patched = patchContent(oldContent, patch);
    expect(patched.newContent).toBe(newContent);
});
