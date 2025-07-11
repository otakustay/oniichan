import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execa} from 'execa';
import type {FixtureSource} from './interface.js';

export interface GitHubFixtureSourceConfig {
    type: 'github';
    repo: string;
    commit: string;
}

export class GitHubFixtureSource implements FixtureSource {
    private source: GitHubFixtureSourceConfig;

    constructor(source: GitHubFixtureSourceConfig) {
        this.source = source;
    }

    async fetch(fixtureName: string, parentDirectory: string) {
        const targetDirectory = path.join(parentDirectory, fixtureName);

        if (existsSync(targetDirectory)) {
            const ready = await this.setupExists(targetDirectory);
            if (ready) {
                return targetDirectory;
            }
        }

        await fs.rm(targetDirectory, {recursive: true, force: true});
        await this.setupEmpty(targetDirectory);

        return targetDirectory;
    }

    private async setupExists(targetDirectory: string) {
        const {stdout: originUrl} = await execa(
            'git',
            ['remote', 'get-url', 'origin'],
            {cwd: targetDirectory}
        );

        if (originUrl.trim() !== this.source.repo) {
            return false;
        }

        await execa('git', ['reset'], {cwd: targetDirectory});
        await execa('git', ['checkout', '.'], {cwd: targetDirectory});
        await execa('git', ['clean', '-fd'], {cwd: targetDirectory});
        try {
            await execa('git', ['checkout', this.source.commit], {cwd: targetDirectory});
        }
        catch {
            await execa('git', ['fetch', '--depth=1', 'origin', this.source.commit], {cwd: targetDirectory});
            await execa('git', ['checkout', 'FETCH_HEAD'], {cwd: targetDirectory});
        }
        return true;
    }

    private async setupEmpty(targetDirectory: string) {
        await fs.mkdir(targetDirectory, {recursive: true});
        await execa('git', ['init'], {cwd: targetDirectory});
        await execa('git', ['remote', 'add', 'origin', this.source.repo], {cwd: targetDirectory});
        await execa('git', ['fetch', '--depth=1', 'origin', this.source.commit], {cwd: targetDirectory});
        await execa('git', ['checkout', 'FETCH_HEAD'], {cwd: targetDirectory});
    }
}
