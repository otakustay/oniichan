import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import os from 'node:os';
import {isGitIgnored} from 'globby';
import {directories as defaultIgnoreDirectories} from 'ignore-by-default';

const APP_DIR = 'oniichan-coding-assitant';

type PathTestCase = string | null | undefined | (() => Promise<string | null | undefined>);

async function ensure(base: string, ...children: string[]) {
    const directory = path.resolve(base, base.includes(APP_DIR) ? '' : APP_DIR, ...children);

    if (!existsSync(directory)) {
        try {
            await fs.mkdir(directory, {recursive: true});
        }
        catch {
            return null;
        }
    }
    return directory;
}

async function testDirectory(...values: PathTestCase[]): Promise<string | null> {
    for (const value of values) {
        const directory = typeof value === 'function' ? await value() : value;

        if (!directory) {
            continue;
        }

        try {
            if (!existsSync(directory)) {
                await fs.mkdir(directory, {recursive: true});
            }

            await fs.access(directory, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
            return directory;
        }
        catch {
            // Continue to test next directory
        }
    }

    return null;
}

async function homeBase() {
    const directory = await testDirectory(
        os.homedir(),
        process.env.USERPROFILE && path.resolve(process.env.USERPROFILE),
        process.env.HOME && path.resolve(process.env.HOME)
    );
    return directory;
}

export async function homeDirecotry(...children: string[]) {
    const base = await homeBase();
    return base && ensure(base, ...children);
}

async function tmpBase() {
    const directory = await testDirectory(
        os.tmpdir(),
        '/tmp'
    );
    return directory;
}

export async function tmpDirectory(...children: string[]) {
    const base = await tmpBase();
    return base && ensure(base, ...children);
}

export async function dataDirectory(...children: string[]) {
    const base = await testDirectory(
        process.env.APPDATA && path.resolve(process.env.APPDATA),
        () => homeBase().then(home => (home && path.join(home, 'Library', 'Application Support'))),
        process.env.XDG_DATA_HOME && path.resolve(process.env.XDG_DATA_HOME),
        () => homeBase().then(home => (home && path.join(home, '.config'))),
        () => tmpDirectory()
    );
    return base && ensure(base, 'data', ...children);
}

export async function globalConfigDirectory(...children: string[]) {
    const base = await testDirectory(
        process.env.XDG_CONFIG_HOME && path.resolve(process.env.XDG_CONFIG_HOME),
        () => homeBase().then(home => (home && path.join(home, '.config'))),
        () => dataDirectory('.config')
    );
    return base && ensure(base, ...children);
}

export async function createGitIgnoreFilter(cwd: string) {
    const filter = await isGitIgnored({cwd});
    return (file: string) => filter(file);
}

interface ExcludeDirectoryOptions {
    filterGitIgnore: (file: string) => boolean;
}

export function shouldDirectoryExcludedFromSearch(directory: string, options?: ExcludeDirectoryOptions) {
    if (defaultIgnoreDirectories().some(v => directory.includes(v))) {
        return true;
    }
    if (options) {
        return options.filterGitIgnore(directory);
    }
    return false;
}
