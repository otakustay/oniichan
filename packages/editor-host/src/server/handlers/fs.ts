import {FileType, Uri, workspace} from 'vscode';
import {RequestHandler} from '@otakustay/ipc';
import {Context} from '../interface';

export class ReadFileHandler extends RequestHandler<string, string, Context> {
    static action = 'readFile' as const;

    async *handleRequest(uri: string): AsyncIterable<string> {
        const content = await workspace.fs.readFile(Uri.parse(uri));
        yield Buffer.from(content).toString('utf-8');
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

export class ReadDirectoryHandler extends RequestHandler<ReadDirectoryRequest, FileEntry[], Context> {
    static action = 'readDirectory' as const;

    async *handleRequest({path, depth}: ReadDirectoryRequest): AsyncIterable<FileEntry[]> {
        const entries = await this.read(Uri.parse(path), depth);
        yield entries;
    }

    private async read(uri: Uri, depth?: number): Promise<FileEntry[]> {
        const tuples = await workspace.fs.readDirectory(uri);
        const toEntry = async ([name, type]: [string, FileType]): Promise<FileEntry> => {
            const entry: FileEntry = {name, type: toFileEntryType(type)};
            if (depth && type === FileType.Directory) {
                const childUri = Uri.joinPath(uri, name);
                entry.children = await this.read(childUri, depth - 1);
            }
            return entry;
        };
        return Promise.all(tuples.map(toEntry));
    }
}

export class GetWorkspaceRootHandler extends RequestHandler<void, string | null, Context> {
    static action = 'getWorkspaceRoot' as const;

    async *handleRequest(): AsyncIterable<string | null> {
        yield workspace.workspaceFolders?.at(0)?.uri.toString() ?? null;
    }
}
