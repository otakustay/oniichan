import {commands, Position, Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import path from 'node:path';
import {RequestHandler} from '@otakustay/ipc';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
import {Context} from '../interface';

export type DiffAction = 'create' | 'diff' | 'delete';

export interface RenderDiffViewRequest {
    action: DiffAction;
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
    action: DiffAction;
    file: string;
    newContent: string;
}

export class AcceptFileEditHandler extends RequestHandler<AcceptEditRequest, void, Context> {
    static readonly action = 'acceptFileEdit';

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
        const {logger} = this.context;

        if (payload.action === 'delete') {
            logger.trace('DeleteFile');
            edit.deleteFile(uri);
        }
        else if (payload.action === 'create') {
            logger.trace('CreateFile');
            edit.createFile(
                uri,
                {
                    overwrite: true,
                    contents: Buffer.from(payload.newContent, 'utf-8'),
                }
            );
        }
        else {
            logger.trace('ReplaceFile');
            edit.replace(
                uri,
                new Range(new Position(0, 0), new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)),
                payload.newContent
            );
        }

        await workspace.applyEdit(edit);

        if (payload.action === 'delete') {
            return;
        }

        const document = await workspace.openTextDocument(uri);
        await document.save();
        await window.showTextDocument(document);
    }
}
