import {expect, test} from 'vitest';
import dedent from 'dedent';
import {WorkspaceFileStructure} from '../tree';

test('one file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    const expected = dedent`
        .
        ├── a/b/c/
        │   ├── file.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('multiple children directories', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file1.txt')).toBe(true);
    expect(structure.add('a/b/d/file2.txt')).toBe(true);
    const expected = dedent`
        .
        ├── a/b/
        │   ├── c/
        │   │   ├── file1.txt
        │   ├── d/
        │   │   ├── file2.txt
    `;
    expect(structure.toTreeString()).toBe(expected);
});

test('insert existing file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.add('a/b/c/file.txt')).toBe(false);
    expect(structure.toArray()).toEqual(['a/', 'a/b/', 'a/b/c/', 'a/b/c/file.txt']);
});

test('insert existing directory', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.add('a/b/')).toBe(false);
    expect(structure.toArray()).toEqual(['a/', 'a/b/', 'a/b/c/', 'a/b/c/file.txt']);
});

test('delete file', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.delete('a/b/c/file.txt')).toBe(true);
    expect(structure.toArray()).toEqual(['a/', 'a/b/', 'a/b/c/']);
});

test('delete directory', () => {
    const structure = new WorkspaceFileStructure();
    expect(structure.add('a/b/c/file.txt')).toBe(true);
    expect(structure.delete('a/b/')).toBe(true);
    expect(structure.toArray()).toEqual(['a/']);
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
    const {tree, totalCount, truncatedCount} = structure.toOverviewStructure();
    expect(totalCount).toBe(502);
    expect(truncatedCount).toBe(495);
    expect(tree.split('\n').length).toBe(8);
    expect(tree.split('\n').filter(v => v.includes('not shown')).length).toBe(1);
});

test('overview structure trim max lines', () => {
    const structure = new WorkspaceFileStructure();
    for (let i = 0; i < 500; i++) {
        structure.add(`a/b/c/dir${i}/`);
    }
    const {tree, totalCount, truncatedCount} = structure.toOverviewStructure();
    expect(totalCount).toBe(502);
    expect(truncatedCount).toBe(303);
    expect(tree.split('\n').length).toBe(200);
    expect(tree.split('\n').filter(v => v.includes('not shown')).length).toBe(1);
});

test('overview structure mixed trim', () => {
    const structure = new WorkspaceFileStructure();
    for (let i = 0; i < 100; i++) {
        structure.add(`a/b/c/dir${i}/`);
        for (let j = 0; j < 100; j++) {
            structure.add(`a/b/c/dir${i}/file${j}.txt`);
        }
    }
    const {tree, totalCount, truncatedCount} = structure.toOverviewStructure();
    expect(totalCount).toBe(10102);
    expect(truncatedCount).toBe(10003);
    expect(tree.split('\n').length).toBe(200);
    expect(tree.split('\n').filter(v => v.includes('not shown')).length).toBe(29);
});

test('empty structure', () => {
    const structure = new WorkspaceFileStructure();
    const {tree, totalCount, truncatedCount} = structure.toOverviewStructure();
    expect(tree).toBe('');
    expect(totalCount).toBe(0);
    expect(truncatedCount).toBe(0);
});
