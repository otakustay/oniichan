import {commands, Uri, workspace} from 'vscode';
import path from 'node:path';
import {RequestHandler} from '@otakustay/ipc';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/string';
import {Context} from '../interface';

export interface RenderDiffViewRequest {
    file: string;
    oldContent: string;
    newContent: string;
}

export class RenderDiffViewHandler extends RequestHandler<RenderDiffViewRequest, void, Context> {
    static readonly action = 'renderDiffView';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: RenderDiffViewRequest) {
        const {logger} = this.context;
        logger.info('Start', payload);

        const directory = await tmpDirectory('inbox-diff');

        if (!directory) {
            logger.error('Fail', {reason: 'Unable to use temp directory'});
            throw new Error('Unable to use temp directory');
        }

        const {nanoid} = await import('nanoid');
        const extension = path.extname(payload.file);
        const oldFile = path.join(directory, nanoid() + extension);
        const newFile = path.join(directory, nanoid() + extension);
        logger.trace('WriteFileStart', {oldFile, newFile});
        await workspace.fs.writeFile(Uri.file(oldFile), Buffer.from(payload.oldContent));
        await workspace.fs.writeFile(Uri.file(newFile), Buffer.from(payload.newContent));
        logger.trace('WriteFileFinish');

        logger.trace('OpenDiffEditor');
        await commands.executeCommand(
            'vscode.diff',
            Uri.file(oldFile),
            Uri.file(newFile),
            `Diff to ${payload.file}`,
            {preview: true}
        );
    }
}

interface AcceptEditRequest {
    file: string;
    content: string;
    action: 'modify' | 'delete';
}

export class AcceptEditHandler extends RequestHandler<AcceptEditRequest, void, Context> {
    static action = 'acceptEdit' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: AcceptEditRequest) {
        const {logger} = this.context;
        logger.info('Start', payload);

        const root = workspace.workspaceFolders?.at(0)?.uri.fsPath;

        if (!root) {
            logger.error('Fail', {reason: 'No open workspace'});
            throw new Error('No open workspace');
        }

        const absolute = path.join(root, payload.file);
        const uri = Uri.file(absolute);
        try {
            if (payload.action === 'modify') {
                await workspace.fs.writeFile(uri, Buffer.from(payload.content, 'utf-8'));
                await commands.executeCommand('vscode.open', uri);
            }
            else {
                await workspace.fs.delete(uri);
            }
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}
