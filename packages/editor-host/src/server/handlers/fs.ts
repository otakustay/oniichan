import {FileType, Uri, workspace} from 'vscode';
import {createGitIgnoreFilter, shouldDirectoryExcludedFromSearch} from '@oniichan/shared/dir';
import {RequestHandler} from './handler';

export class ReadFileHandler extends RequestHandler<string, string> {
    static readonly action = 'readFile';

    async *handleRequest(file: string): AsyncIterable<string> {
        const {logger} = this.context;
        logger.info('Start', {file});

        const uri = this.resolveFileUri(file);
        const content = await workspace.fs.readFile(uri);
        yield Buffer.from(content).toString('utf-8');

        logger.info('Finish');
    }
}

export interface ReadDirectoryRequest {
    path: string;
    depth?: number;
}

export type FileEntryType = 'unknown' | 'file' | 'directory' | 'symlink';

export interface FileEntry {
    name: string;
    type: FileEntryType;
    children?: FileEntry[];
}

function toFileEntryType(input: FileType): FileEntryType {
    switch (input) {
        case FileType.Unknown:
            return 'unknown';
        case FileType.File:
            return 'file';
        case FileType.Directory:
            return 'directory';
        case FileType.SymbolicLink:
            return 'symlink';
    }
}

export class ReadDirectoryHandler extends RequestHandler<ReadDirectoryRequest, FileEntry[]> {
    static readonly action = 'readDirectory';

    async *handleRequest(payload: ReadDirectoryRequest): AsyncIterable<FileEntry[]> {
        const {logger} = this.context;
        logger.info('Start', payload);

        const uri = this.resolveFileUri(payload.path);
        const entries = await this.read(uri, payload.depth);
        yield entries;

        logger.info('Finish');
    }

    private async read(uri: Uri, depth?: number): Promise<FileEntry[]> {
        const tuples = await workspace.fs.readDirectory(uri);
        const workspaceRoot = workspace.workspaceFolders?.at(0)?.uri.fsPath;
        const filterGitIgnore = workspaceRoot ? await createGitIgnoreFilter(workspaceRoot) : () => false;
        const toEntry = async ([name, type]: [string, FileType]): Promise<FileEntry | FileEntry[]> => {
            if (shouldDirectoryExcludedFromSearch(name, {filterGitIgnore})) {
                return [];
            }

            const entry: FileEntry = {name, type: toFileEntryType(type)};
            if (depth && type === FileType.Directory) {
                const childUri = Uri.joinPath(uri, name);
                entry.children = await this.read(childUri, depth - 1);
            }
            return entry;
        };
        const entries = await Promise.all(tuples.map(toEntry));
        return entries.flat();
    }
}

export class CheckFileExistsHandler extends RequestHandler<string, boolean> {
    static readonly action = 'checkFileExists';

    async *handleRequest(file: string): AsyncIterable<boolean> {
        try {
            const uri = this.resolveFileUri(file);
            const stat = await workspace.fs.stat(uri);
            yield !!(stat.type & FileType.File);
        }
        catch {
            yield false;
        }
    }
}

export class CreateDirectoryHandler extends RequestHandler<string, void> {
    static readonly action = 'createDirectory';

    // eslint-disable-next-line require-yield
    async *handleRequest(directory: string): AsyncIterable<void> {
        const {logger} = this.context;
        logger.info('Start', {path: directory});

        const uri = this.resolveFileUri(directory);
        await workspace.fs.createDirectory(uri);

        logger.info('Finish');
    }
}
