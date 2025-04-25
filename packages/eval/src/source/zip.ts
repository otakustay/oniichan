import path from 'node:path';
import fs from 'node:fs/promises';
import decompress from 'decompress';
import type {FixtureSource} from './interface';

const archiveBaseDirectory = path.resolve(__dirname, '..', 'fixtures', 'archives');

export interface ZipFixtureSourceConfig {
    type: 'zip';
    path: string;
}

export class ZipFixtureSource implements FixtureSource {
    private source: ZipFixtureSourceConfig;

    constructor(source: ZipFixtureSourceConfig) {
        this.source = source;
    }

    async fetch(fixtureName: string, parentDirectory: string) {
        const file = path.join(archiveBaseDirectory, this.source.path);
        const targetDirectory = path.join(parentDirectory, fixtureName);
        await fs.rm(targetDirectory, {recursive: true, force: true});
        await fs.mkdir(targetDirectory, {recursive: true});
        await decompress(file, targetDirectory);
        return targetDirectory;
    }
}
