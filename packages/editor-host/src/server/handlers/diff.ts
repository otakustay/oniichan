import {commands, Position, Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
import {FileEditData, FileEditResult} from '@oniichan/shared/patch';
import {RequestHandler} from './handler';

export type AppliableState = 'appliable' | 'error' | 'conflict' | 'applied';

abstract class DiffRequestHandler<I, O> extends RequestHandler<I, O> {
    protected async checkEditAppliable(edit: FileEditData): Promise<AppliableState> {
        if (edit.type === 'error' || edit.type === 'patchError') {
            return 'error';
        }

        try {
            const content = await this.readFileContent(edit.file);
            // We allow to apply an edit in some cases even if the file is not modified:
            //
            // 1. To create a file, it already exists but its content is empty
            // 2. To write a file with full content, the original file has been deleted
            // 3. To modify a file, the file content has different heading and trailing whitespace
            // 4. To delete a file, but it has been modified, this means all delete actions are appliable
            switch (edit.type) {
                case 'create':
                    return content ? 'conflict' : 'appliable';
                case 'edit':
                    return content.trim() === edit.newContent.trim()
                        ? 'applied'
                        : (content.trim() === edit.oldContent.trim() ? 'appliable' : 'conflict');
                default:
                    return 'appliable';
            }
        }
        catch (ex) {
            if (edit.type === 'create') {
                return 'appliable';
            }
            if (edit.type === 'delete') {
                return 'applied';
            }

            throw ex;
        }
    }

    protected async ensureEditAppliable(edit: FileEditData) {
        const appliable = await this.checkEditAppliable(edit);

        if (appliable === 'applied') {
            throw new Error('Patch is already applied to file');
        }

        if (appliable !== 'appliable') {
            throw new Error('Patch is not appliable to file');
        }
    }
}

export class CheckEditAppliableHandler extends DiffRequestHandler<FileEditData, AppliableState> {
    static readonly action = 'checkEditAppliable';

    async *handleRequest(payload: FileEditData) {
        const appliable = await this.checkEditAppliable(payload);
        yield appliable;
    }
}

export class RenderDiffViewHandler extends DiffRequestHandler<FileEditResult, AppliableState> {
    static readonly action = 'renderDiffView';

    async *handleRequest(payload: FileEditResult): AsyncIterable<AppliableState> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            const appliable = await this.checkEditAppliable(payload);

            if (appliable !== 'appliable') {
                yield appliable;
                return;
            }

            const directory = await tmpDirectory('inbox-diff');

            if (!directory) {
                logger.error('Fail', {reason: 'Unable to use temp directory'});
                throw new Error('Unable to use temp directory');
            }

            logger.trace('OpenDiffView');
            await diffViewManager.open(payload);

            yield appliable;
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

export class AcceptFileEditHandler extends DiffRequestHandler<FileEditResult, AppliableState> {
    static readonly action = 'acceptFileEdit';

    async *handleRequest(payload: FileEditResult): AsyncIterable<AppliableState> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            const appliable = await this.checkEditAppliable(payload);

            if (appliable !== 'appliable') {
                yield appliable;
                return;
            }

            const fileUri = this.resolveFileUri(payload.file);
            const edit = new WorkspaceEdit();

            logger.trace('ApplyEdit');
            await this.applyEdit(payload, edit, fileUri);

            logger.trace('CloseDiffEditor');
            await diffViewManager.close(payload.file);

            if (payload.type !== 'delete') {
                logger.trace('OpenDocument');
                await commands.executeCommand('vscode.open', fileUri);
            }

            yield 'applied';
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }

    private async applyEdit(payload: FileEditResult, edit: WorkspaceEdit, uri: Uri) {
        const {logger} = this.context;

        if (payload.type === 'delete') {
            logger.trace('DeleteFile');
            edit.deleteFile(uri);
        }
        else if (payload.type === 'create') {
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

        if (payload.type === 'delete') {
            return;
        }

        const document = await workspace.openTextDocument(uri);
        await document.save();
        await window.showTextDocument(document);
    }
}
