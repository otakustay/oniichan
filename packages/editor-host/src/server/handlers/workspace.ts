import path from 'node:path';
import {Uri, workspace} from 'vscode';
import {RequestHandler} from '@otakustay/ipc';
import {stringifyError} from '@oniichan/shared/string';
import {Context} from '../interface';

interface FindFilesRequest {
    glob: string;
    limit?: number;
}

export class FindFilesHandler extends RequestHandler<FindFilesRequest, string[], Context> {
    static action = 'findFiles' as const;

    async *handleRequest({glob, limit}: FindFilesRequest): AsyncIterable<string[]> {
        const files = await workspace.findFiles(glob, null, limit);
        yield files.map(v => v.toString());
    }
}

export class GetWorkspaceRootHandler extends RequestHandler<void, string | null, Context> {
    static action = 'getWorkspaceRoot' as const;

    async *handleRequest(): AsyncIterable<string | null> {
        yield workspace.workspaceFolders?.at(0)?.uri.toString() ?? null;
    }
}

export class ReadWorkspaceFileHandler extends RequestHandler<string, string | null, Context> {
    static action = 'readWorkspaceFile' as const;

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

interface WriteWorkspaceFileRequest {
    file: string;
    content: string;
}

export class WriteWorkspaceFileHandler extends RequestHandler<WriteWorkspaceFileRequest, void, Context> {
    static action = 'writeWorkspaceFile' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: WriteWorkspaceFileRequest) {
        const {logger} = this.context;
        logger.info('Start', payload);

        const root = workspace.workspaceFolders?.at(0)?.uri.fsPath;

        if (!root) {
            logger.error('Fail', {reason: 'No open workspace'});
            throw new Error('No open workspace');
        }

        const absolute = path.join(root, payload.file);
        try {
            await workspace.fs.writeFile(Uri.file(absolute), Buffer.from(payload.content, 'utf-8'));
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}
