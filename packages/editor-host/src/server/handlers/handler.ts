import path from 'node:path';
import {Uri, workspace} from 'vscode';
import {RequestHandler as BaseRequestHandler, ExecutionRequest, Port} from '@otakustay/ipc';
import {Context} from '../interface';

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const loggerOverride = {
            source: new.target.name,
            taskId: request.taskId,
            functionName: new.target.name.replace(/Handler$/, ''),
        };
        super(
            port,
            request,
            {...context, logger: context.logger.with(loggerOverride)}
        );
    }

    protected getWorkspaceRootStrict(): string {
        const root = workspace.workspaceFolders?.at(0)?.uri.fsPath;

        if (!root) {
            const {logger} = this.context;
            logger.error('Fail', {reason: 'No open workspace'});
            throw new Error('No open workspace');
        }

        return root;
    }
    protected resolveFileUri(file: string): Uri {
        const root = this.getWorkspaceRootStrict();
        const absolute = path.join(root, file);
        return Uri.file(absolute);
    }

    protected async readFileContent(file: Uri | string): Promise<string> {
        const uri = typeof file === 'string' ? this.resolveFileUri(file) : file;
        const buffer = await workspace.fs.readFile(uri);
        return Buffer.from(buffer).toString('utf-8');
    }
}
