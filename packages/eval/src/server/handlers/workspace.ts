import fs from 'node:fs/promises';
import path from 'node:path';
import {streamingListEntries, WorkspaceFileStructure} from '@oniichan/shared/dir';
import type {TreeifyResult} from '@oniichan/shared/dir';
import type {FindFilesRequest, WriteWorkspaceFileRequest} from '@oniichan/editor-host/protocol';
import {RequestHandler} from './handler';

export class FindFilesHandler extends RequestHandler<FindFilesRequest, string[]> {
    static readonly action = 'findFiles';

    async *handleRequest(payload: FindFilesRequest): AsyncIterable<string[]> {
        const {globby} = await import('globby');
        const {cwd} = this.context;
        const files = await globby(
            payload.glob,
            {
                cwd,
                gitignore: true,
                absolute: false,
                dot: false,
                markDirectories: true,
                onlyFiles: false,
            }
        );
        yield payload.limit ? files.slice(0, payload.limit) : files;
    }
}

export class GetWorkspaceRootHandler extends RequestHandler<void, string | null> {
    static readonly action = 'getWorkspaceRoot';

    async *handleRequest(): AsyncIterable<string | null> {
        const {cwd} = this.context;
        yield cwd;
    }
}

export class ReadWorkspaceFileHandler extends RequestHandler<string, string | null> {
    static readonly action = 'readWorkspaceFile';

    async *handleRequest(file: string): AsyncIterable<string | null> {
        try {
            const content = await this.readFileContent(file);
            yield content;
        }
        catch {
            return null;
        }
    }
}
export class WriteWorkspaceFileHandler extends RequestHandler<WriteWorkspaceFileRequest, void> {
    static readonly action = 'writeWorkspaceFile';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: WriteWorkspaceFileRequest) {
        const absolute = this.resolveFilePath(payload.file);
        await fs.mkdir(path.dirname(absolute), {recursive: true});
        await fs.writeFile(absolute, payload.content);
    }
}

export class DeleteWorkspaceFileHandler extends RequestHandler<string, boolean> {
    static readonly action = 'deleteWorkspaceFile';

    async *handleRequest(file: string): AsyncIterable<boolean> {
        const absolute = this.resolveFilePath(file);
        try {
            await fs.rm(absolute);
            yield true;
        }
        catch {
            yield false;
        }
    }
}

export class GetWorkspaceStructureHandler extends RequestHandler<void, TreeifyResult> {
    static readonly action = 'getWorkspaceStructure';

    async *handleRequest(): AsyncIterable<TreeifyResult> {
        const {cwd} = this.context;
        const structure = new WorkspaceFileStructure();
        try {
            for await (const file of streamingListEntries(cwd)) {
                structure.add(file);
            }
            yield structure.toOverviewStructure();
        }
        catch {
            yield {
                tree: '',
                totalCount: 0,
                truncatedCount: 0,
            };
        }
    }
}
