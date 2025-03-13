import type { Uri} from 'vscode';
import {Position, Range, window, workspace, WorkspaceEdit} from 'vscode';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
import {revertFileEdit} from '@oniichan/shared/patch';
import type {FileEditData, FileEditResult} from '@oniichan/shared/patch';
import {RequestHandler} from './handler';

export type AppliableState = 'appliable' | 'error' | 'conflict' | 'applied';

interface MeaningfulEditStack {
    edits: FileEditResult[];
    first: FileEditResult;
    last: FileEditResult;
}

abstract class DiffRequestHandler<I, O> extends RequestHandler<I, O> {
    protected ensureMeaningfulEditStack(edits: FileEditData[]): MeaningfulEditStack {
        const meaningfulEdits = edits.filter(v => v.type !== 'error');
        const first = meaningfulEdits.at(0);
        const last = meaningfulEdits.at(-1);

        if (meaningfulEdits.length < edits.length || !first || !last) {
            throw new Error('Edit stack contains errored edit');
        }

        return {
            edits: meaningfulEdits,
            first,
            last,
        };
    }

    protected async checkEditStckAppliable(stack: MeaningfulEditStack): Promise<AppliableState> {
        try {
            const content = await this.readFileContent(stack.last.file);
            const [appliable] = stack.edits.reduce<[AppliableState, string]>(
                ([appliable, oldContent], edit) => [
                    appliable !== 'appliable' && appliable !== 'applied'
                        ? appliable
                        : this.checkSingleEditAppliable(oldContent, edit),
                    edit.newContent,
                ],
                ['appliable', content]
            );
            return appliable;
        }
        catch (ex) {
            // Incase the file is not found, we can apply create or delete action to file
            if (stack.last.type === 'create') {
                return 'appliable';
            }
            if (stack.last.type === 'delete') {
                return 'applied';
            }

            throw ex;
        }
    }

    private checkSingleEditAppliable(content: string, edit: FileEditResult): AppliableState {
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
}

export class CheckEditAppliableHandler extends DiffRequestHandler<FileEditData[], AppliableState> {
    static readonly action = 'checkEditAppliable';

    async *handleRequest(payload: FileEditData[]) {
        try {
            const stack = this.ensureMeaningfulEditStack(payload);
            const appliable = await this.checkEditStckAppliable(stack);
            yield appliable;
        }
        catch {
            return 'error';
        }
    }
}

export class RenderDiffViewHandler extends DiffRequestHandler<FileEditResult, void> {
    static readonly action = 'renderDiffView';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: FileEditResult): AsyncIterable<void> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            const directory = await tmpDirectory('inbox-diff');

            if (!directory) {
                logger.error('Fail', {reason: 'Unable to use temp directory'});
                throw new Error('Unable to use temp directory');
            }

            logger.trace('OpenDiffView');
            const options = {
                file: payload.file,
                oldContent: payload.oldContent,
                newContent: payload.newContent,
            };
            await diffViewManager.open(options);

            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

export interface AcceptFileEditRequest {
    edit: FileEditResult;
    revert: boolean;
}

export class AcceptFileEditHandler extends DiffRequestHandler<AcceptFileEditRequest, void> {
    static readonly action = 'acceptFileEdit';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: AcceptFileEditRequest): AsyncIterable<void> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        try {
            const edit = payload.revert ? revertFileEdit(payload.edit) : payload.edit;
            const fileUri = this.resolveFileUri(edit.file);

            logger.trace('ApplyEdit');
            await this.applyEdit(edit, fileUri);

            logger.trace('CloseDiffEditor');
            await diffViewManager.close(edit.file);

            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }

    private async applyEdit(edit: FileEditResult, uri: Uri) {
        const workspaceEdit = new WorkspaceEdit();
        const {logger} = this.context;

        if (edit.type === 'delete') {
            logger.trace('DeleteFile');
            workspaceEdit.deleteFile(uri);
        }
        else if (edit.type === 'create') {
            logger.trace('CreateFile');
            workspaceEdit.createFile(
                uri,
                {
                    overwrite: true,
                    contents: Buffer.from(edit.newContent, 'utf-8'),
                }
            );
        }
        else {
            logger.trace('ReplaceFile');
            workspaceEdit.replace(
                uri,
                new Range(new Position(0, 0), new Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)),
                edit.newContent
            );
        }

        await workspace.applyEdit(workspaceEdit);

        if (edit.type === 'delete') {
            return;
        }

        const document = await workspace.openTextDocument(uri);
        await document.save();
        await window.showTextDocument(document);
    }
}
