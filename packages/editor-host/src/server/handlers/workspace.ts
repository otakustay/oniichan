import path from 'node:path';
import {Uri, workspace} from 'vscode';
import {stringifyError} from '@oniichan/shared/error';
import {RequestHandler} from './handler';

export interface FindFilesRequest {
    glob: string;
    limit?: number;
}

export class FindFilesHandler extends RequestHandler<FindFilesRequest, string[]> {
    static readonly action = 'findFiles';

    async *handleRequest({glob, limit}: FindFilesRequest): AsyncIterable<string[]> {
        const files = await workspace.findFiles(glob, null, limit);
        yield files.map(v => v.toString());
    }
}

export class GetWorkspaceRootHandler extends RequestHandler<void, string | null> {
    static readonly action = 'getWorkspaceRoot';

    async *handleRequest(): AsyncIterable<string | null> {
        yield workspace.workspaceFolders?.at(0)?.uri.toString() ?? null;
    }
}

export class ReadWorkspaceFileHandler extends RequestHandler<string, string | null> {
    static readonly action = 'readWorkspaceFile';

    async *handleRequest(file: string): AsyncIterable<string | null> {
        for (const folder of workspace.workspaceFolders ?? []) {
            const absolute = path.join(folder.uri.fsPath, file);
            try {
                const content = await workspace.fs.readFile(Uri.file(absolute));
                yield Buffer.from(content).toString('utf-8');
            }
            catch {
                // Go next workspace folder
            }
        }

        yield null;
    }
}

export interface WriteWorkspaceFileRequest {
    file: string;
    content: string;
}

export class WriteWorkspaceFileHandler extends RequestHandler<WriteWorkspaceFileRequest, void> {
    static readonly action = 'writeWorkspaceFile';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: WriteWorkspaceFileRequest) {
        const {logger} = this.context;
        logger.info('Start', payload);

        const fileUri = this.resolveFileUri(payload.file);
        try {
            await workspace.fs.writeFile(fileUri, Buffer.from(payload.content, 'utf-8'));
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}
