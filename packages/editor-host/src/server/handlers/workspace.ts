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

    async *handleRequest(payload: FindFilesRequest): AsyncIterable<string[]> {
        const {logger} = this.context;
        logger.info('Start', payload);

        const files = await workspace.findFiles(payload.glob, null, payload.limit);
        yield files.map(v => v.fsPath);

        logger.info('Finish');
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
        const {logger} = this.context;
        logger.info('Start', {file});

        for (const folder of workspace.workspaceFolders ?? []) {
            const absolute = path.join(folder.uri.fsPath, file);
            try {
                const content = await workspace.fs.readFile(Uri.file(absolute));
                yield Buffer.from(content).toString('utf-8');
                logger.info('Finish');
                return;
            }
            catch {
                // Go next workspace folder
            }
        }

        logger.info('NotFound');
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
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}
