import {RequestHandler} from '@otakustay/ipc';
import {workspace} from 'vscode';
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
