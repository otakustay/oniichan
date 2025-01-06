import {commands, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import path from 'node:path';
import {RequestHandler} from '@otakustay/ipc';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/string';
import {Context} from '../interface';

function formatDiffViewTitle(file: string) {
    return `Diff to ${file}`;
}

export interface RenderDiffViewRequest {
    file: string;
    oldContent: string;
    newContent: string;
    previousDiffViewOldFile?: string;
    previousDiffViewNewFile?: string;
}

export interface RenderDiffViewResponse {
    oldFile: string;
    newFile: string;
}

abstract class DiffViewHandler<T, R> extends RequestHandler<T, R, Context> {
    protected async tryDeleteTrash(file: string | undefined) {
        if (!file) {
            return;
        }

        const {logger} = this.context;
        const uri = Uri.file(file);
        try {
            await workspace.fs.delete(uri);
        }
        catch (ex) {
            logger.warn(`DeleteTrachFail`, {reason: stringifyError(ex)});
        }
    }

    protected async closeDiffEditor(file: string) {
        const title = formatDiffViewTitle(file);
        for (const tab of window.tabGroups.all.flatMap(v => v.tabs)) {
            if (tab.label === title) {
                await window.tabGroups.close(tab);
            }
        }
    }
}

export class RenderDiffViewHandler extends DiffViewHandler<RenderDiffViewRequest, RenderDiffViewResponse> {
    static readonly action = 'renderDiffView';

    async *handleRequest(payload: RenderDiffViewRequest) {
        const {logger} = this.context;
        logger.info('Start', payload);

        const directory = await tmpDirectory('inbox-diff');

        if (!directory) {
            logger.error('Fail', {reason: 'Unable to use temp directory'});
            throw new Error('Unable to use temp directory');
        }

        try {
            const {nanoid} = await import('nanoid');
            const extension = path.extname(payload.file);
            const oldFile = path.join(directory, nanoid() + extension);
            const newFile = path.join(directory, nanoid() + extension);
            logger.trace('WriteFileStart', {oldFile, newFile});
            await workspace.fs.writeFile(Uri.file(oldFile), Buffer.from(payload.oldContent));
            await workspace.fs.writeFile(Uri.file(newFile), Buffer.from(payload.newContent));
            logger.trace('WriteFileFinish');

            logger.trace('ClosePreviousEditor');
            await this.closeDiffEditor(payload.file);

            logger.trace('OpenDiffEditor');
            await commands.executeCommand(
                'vscode.diff',
                Uri.file(oldFile),
                Uri.file(newFile),
                formatDiffViewTitle(payload.file),
                {preview: true}
            );

            // TODO: We need a diff editor manager to track editor views and delete trash on document close
            logger.trace('DeleteTrash');
            void this.tryDeleteTrash(payload.previousDiffViewOldFile);
            void this.tryDeleteTrash(payload.previousDiffViewNewFile);

            yield {oldFile, newFile};
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
    diffViewOldFile?: string;
    diffViewNewFile?: string;
}

// TODO: Accept a file can cause its content change while LLM retains its old content, we should mark tool call obsolete

export class AcceptEditHandler extends DiffViewHandler<AcceptEditRequest, void> {
    static readonly action = 'acceptEdit';

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
        const edit = new WorkspaceEdit();
        try {
            logger.trace('ApplyEdit');
            await this.applyEdit(payload, edit, uri);

            logger.trace('CloseDiffEditor');
            await this.closeDiffEditor(payload.file);

            logger.trace('DeleteTrash');
            void this.tryDeleteTrash(payload.diffViewOldFile);
            void this.tryDeleteTrash(payload.diffViewNewFile);

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
