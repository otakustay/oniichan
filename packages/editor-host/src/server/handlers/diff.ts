import {commands, Position, Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import {diffLines} from 'diff';
import {tmpDirectory} from '@oniichan/shared/dir';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {FileEditData, FileEditResult} from '@oniichan/shared/inbox';
import {patchContent} from '@oniichan/shared/patch';
import {RequestHandler} from './handler';

export class RenderDiffViewHandler extends RequestHandler<FileEditData, void> {
    static readonly action = 'renderDiffView';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: FileEditResult) {
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
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

export class AcceptFileEditHandler extends RequestHandler<FileEditData, void> {
    static readonly action = 'acceptFileEdit';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: FileEditResult) {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        const fileUri = this.resolveFileUri(payload.file);
        const edit = new WorkspaceEdit();
        try {
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
        // TODO: We should check if the original file is modified, report error if so
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
