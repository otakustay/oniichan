import {commands, Position, Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import {diffLines} from 'diff';
import {tmpDirectory} from '@oniichan/shared/dir';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {FileEditData, FileEditResult} from '@oniichan/shared/inbox';
import {patchContent} from '@oniichan/shared/patch';
import {RequestHandler} from './handler';

abstract class DiffRequestHandler<I, O> extends RequestHandler<I, O> {
    protected async checkEditAppliable(edit: FileEditData) {
        if (edit.type === 'error') {
            return false;
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
                    return !content;
                case 'edit':
                    return content === null || content.trim() === edit.oldContent.trim();
                default:
                    return true;
            }
        }
        catch (ex) {
            if (edit.type === 'create') {
                return true;
            }

            throw ex;
        }
    }

    protected async ensureEditAppliable(edit: FileEditData) {
        const appliable = await this.checkEditAppliable(edit);

        if (!appliable) {
            throw new Error('Patch is not appliable to file');
        }
    }
}

export class CheckEditAppliableHandler extends DiffRequestHandler<FileEditData, boolean> {
    static readonly action = 'checkEditAppliable';

    async *handleRequest(payload: FileEditData) {
        const appliable = await this.checkEditAppliable(payload);
        yield appliable;
    }
}

export class RenderDiffViewHandler extends DiffRequestHandler<FileEditResult, void> {
    static readonly action = 'renderDiffView';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: FileEditResult) {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            await this.ensureEditAppliable(payload);

            const directory = await tmpDirectory('inbox-diff');

            if (!directory) {
                logger.error('Fail', {reason: 'Unable to use temp directory'});
                throw new Error('Unable to use temp directory');
            }

            logger.trace('OpenDiffView');
            await diffViewManager.open(payload);
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

export class AcceptFileEditHandler extends DiffRequestHandler<FileEditResult, void> {
    static readonly action = 'acceptFileEdit';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: FileEditResult) {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            await this.ensureEditAppliable(payload);

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

export type VirtualEditFileAction = 'write' | 'patch' | 'delete';

export interface VirtualEditFileRequest {
    action: VirtualEditFileAction;
    file: string;
    patch: string;
}

export class VirtualEditFile extends RequestHandler<VirtualEditFileRequest, FileEditData> {
    static readonly action = 'virtualEditFile';

    async *handleRequest(payload: VirtualEditFileRequest): AsyncIterable<FileEditData> {
        const {logger} = this.context;
        logger.info('Start', payload);

        try {
            switch (payload.action) {
                case 'write':
                    yield await this.write(payload);
                    break;
                case 'delete':
                    yield await this.delete(payload);
                    break;
                case 'patch':
                    yield await this.patch(payload);
                    break;
                default:
                    assertNever<string>(payload.action, v => `Unknown file edit action ${v}`);
            }
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }

        logger.info('Finish');
    }

    async write(payload: VirtualEditFileRequest): Promise<FileEditData> {
        try {
            const fileContent = await this.readFileContent(payload.file);
            const diff = diffLines(fileContent, payload.patch);
            const {deletedCount, insertedCount} = diff.reduce(
                (output, change) => {
                    if (change.added && change.count) {
                        output.insertedCount += change.count;
                    }
                    if (change.removed && change.count) {
                        output.deletedCount += change.count;
                    }
                    return output;
                },
                {deletedCount: 0, insertedCount: 0}
            );
            return {
                type: 'edit',
                file: payload.file,
                oldContent: fileContent,
                newContent: payload.patch,
                deletedCount,
                insertedCount,
            };
        }
        catch {
            // File access error means creating a file
            return {
                type: 'create',
                file: payload.file,
                oldContent: '',
                newContent: payload.patch,
                deletedCount: 0,
                insertedCount: payload.patch.split('\n').length,
            };
        }
    }

    async delete(payload: VirtualEditFileRequest): Promise<FileEditData> {
        const fileContent = await this.readFileContent(payload.file);
        return {
            type: 'delete',
            file: payload.file,
            oldContent: fileContent,
            newContent: '',
            deletedCount: fileContent.split('\n').length,
            insertedCount: 0,
        };
    }

    async patch(payload: VirtualEditFileRequest): Promise<FileEditData> {
        const fileContent = await this.readFileContent(payload.file);
        const patchResult = patchContent(fileContent, payload.patch);
        return {
            type: 'edit',
            file: payload.file,
            oldContent: fileContent,
            newContent: patchResult.newContent,
            deletedCount: patchResult.deletedCount,
            insertedCount: patchResult.insertedCount,
        };
    }
}
