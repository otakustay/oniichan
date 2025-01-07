import {commands, Uri, workspace, WorkspaceEdit} from 'vscode';
import path from 'node:path';
import {RequestHandler} from '@otakustay/ipc';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
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
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        const directory = await tmpDirectory('inbox-diff');

        if (!directory) {
            logger.error('Fail', {reason: 'Unable to use temp directory'});
            throw new Error('Unable to use temp directory');
        }

        try {
            logger.trace('OpenDiffView');
            await diffViewManager.open(payload);
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

export interface AcceptEditRequest {
    file: string;
    content: string;
    action: 'modify' | 'delete';
}

export class AcceptEditHandler extends RequestHandler<AcceptEditRequest, void, Context> {
    static readonly action = 'acceptEdit';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: AcceptEditRequest) {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        const root = workspace.workspaceFolders?.at(0)?.uri.fsPath;

        if (!root) {
            logger.error('Fail', {reason: 'No open workspace'});
            throw new Error('No open workspace');
        }

        const absolute = path.join(root, payload.file);
        const uri = Uri.file(absolute);
        const edit = new WorkspaceEdit();
        try {
            logger.trace('ApplyEdit');
            await this.applyEdit(payload, edit, uri);

            logger.trace('CloseDiffEditor');
            await diffViewManager.close(payload.file);

            if (payload.action !== 'delete') {
                logger.trace('OpenDocument');
                await commands.executeCommand('vscode.open', uri);
            }
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }

    private async applyEdit(payload: AcceptEditRequest, edit: WorkspaceEdit, uri: Uri) {
        if (payload.action === 'modify') {
            edit.createFile(
                uri,
                {
                    overwrite: true,
                    contents: Buffer.from(payload.content, 'utf-8'),
                }
            );
        }
        else {
            edit.deleteFile(uri);
        }
        await workspace.applyEdit(edit);
    }
}
