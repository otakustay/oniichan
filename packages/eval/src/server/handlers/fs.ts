import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import type {GlobEntry} from 'globby';
import type {FileEntry, ReadDirectoryRequest} from '@oniichan/editor-host/protocol';
import {RequestHandler} from './handler';

export class ReadFileHandler extends RequestHandler<string, string> {
    static readonly action = 'readFile';

    async *handleRequest(file: string): AsyncIterable<string> {
        const content = await this.readFileContent(file);
        yield content;
    }
}

async function walkDirectory(cwd: string, path: string, depth: number): Promise<FileEntry[]> {
    const {globby} = await import('globby');
    const entries = await globby(
        path ? `${path}/*` : '*',
        {
            cwd,
            gitignore: true,
            absolute: false,
            dot: false,
            markDirectories: false,
            objectMode: true,
            onlyFiles: false,
        }
    );
    const toEntry = async (item: GlobEntry): Promise<FileEntry> => {
        if (item.dirent.isDirectory()) {
            const entry: FileEntry = {
                name: item.name,
                type: 'directory',
            };
            if (depth > 0) {
                entry.children = await walkDirectory(cwd, path ? `${path}/${item.name}` : item.name, depth - 1);
            }
            return entry;
        }

        return {
            name: item.name,
            type: item.dirent.isFile() ? 'file' : item.dirent.isSymbolicLink() ? 'symlink' : 'unknown',
        };
    };

    return Promise.all(entries.map(toEntry));
}

export class ReadDirectoryHandler extends RequestHandler<ReadDirectoryRequest, FileEntry[]> {
    static readonly action = 'readDirectory';

    async *handleRequest(payload: ReadDirectoryRequest): AsyncIterable<FileEntry[]> {
        const {cwd} = this.context;
        const entries = await walkDirectory(cwd, payload.path, payload.depth ?? 0);
        yield entries;
    }
}

export class CheckFileExistsHandler extends RequestHandler<string, boolean> {
    static readonly action = 'checkFileExists';

    async *handleRequest(file: string): AsyncIterable<boolean> {
        const absolute = this.resolveFilePath(file);
        yield existsSync(absolute);
    }
}

export class CreateDirectoryHandler extends RequestHandler<string, void> {
    static readonly action = 'createDirectory';

    // eslint-disable-next-line require-yield
    async *handleRequest(directory: string): AsyncIterable<void> {
        const absolute = this.resolveFilePath(directory);
        await fs.mkdir(absolute, {recursive: true});
    }
}
