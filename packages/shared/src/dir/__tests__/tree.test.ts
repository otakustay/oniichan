import {expect, test} from 'vitest';
import {WorkspaceFileStructure} from '../tree';
import dedent from 'dedent';

test('one file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    const expected = dedent`
        a/b/c/
          file.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('multiple children directories', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file1.txt')).toBe(true);
    expect(structure.add('a/b/d/file2.txt')).toBe(true);
    const expected = dedent`
        a/b/
          c/
            file1.txt
          d/
            file2.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('insert existing file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.add('a/b/c/file.txt')).toBe(false);
    const expected = dedent`
        a/b/c/
          file.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('insert existing directory', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.add('a/b/')).toBe(false);
    const expected = dedent`
        a/b/c/
          file.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('delete file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.delete('a/b/c/file.txt')).toBe(true);
    expect(structure.toTreeString()).toBe('a/b/c/');
});

test('delete directory', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.delete('a/b/')).toBe(true);
    expect(structure.toTreeString()).toBe('a/');
});

test('to array', () => {
    const structure = new WorkspaceFileStructure();
    structure.add('a/b/c/file.txt');
    structure.add('a/b/d/file.txt');
    const expected = [
        'a/',
        'a/b/',
        'a/b/c/',
        'a/b/c/file.txt',
        'a/b/d/',
        'a/b/d/file.txt',
    ];
    expect(structure.toArray()).toEqual(expected);
});

test('count', () => {
    const structure = new WorkspaceFileStructure();
    structure.add('a/b/c/file.txt');
    structure.add('a/b/d/file.txt');
    expect(structure.count()).toBe(6);
});

test('overview structure trim files in directory', () => {
    const structure = new WorkspaceFileStructure();
    for (let i = 0; i < 500; i++) {
        structure.add(`a/b/c/file${i}.txt`);
    }
    const {tree, truncated} = structure.toOverviewStructure();
    expect(truncated).toBe(true);
    expect(tree.split('\n').length).toBe(6);
});

test('overview structure trim max lines', () => {
    const structure = new WorkspaceFileStructure();
    for (let i = 0; i < 500; i++) {
        structure.add(`a/b/c/dir${i}/`);
    }
    const {tree, truncated} = structure.toOverviewStructure();
    expect(truncated).toBe(true);
    expect(tree.split('\n').length).toBe(200);
});
