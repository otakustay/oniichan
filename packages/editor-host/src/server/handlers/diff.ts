import {commands, Position, Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import {tmpDirectory} from '@oniichan/shared/dir';
import {stringifyError} from '@oniichan/shared/error';
import {FileEditAction, FileEditData, FileEditResult} from '@oniichan/shared/patch';
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

export class RenderDiffViewHandler extends DiffRequestHandler<FileEditData[], AppliableState> {
    static readonly action = 'renderDiffView';

    async *handleRequest(payload: FileEditData[]): AsyncIterable<AppliableState> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        const stack = this.ensureMeaningfulEditStack(payload);

        try {
            const appliable = await this.checkEditStckAppliable(stack);

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
            const options = {
                file: stack.last.file,
                oldContent: stack.first.oldContent,
                newContent: stack.last.newContent,
            };
            await diffViewManager.open(options);

            yield appliable;
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }
}

interface EditApplyInput {
    type: FileEditAction;
    oldContent: string;
    newContent: string;
}

export class AcceptFileEditHandler extends DiffRequestHandler<FileEditData[], AppliableState> {
    static readonly action = 'acceptFileEdit';

    async *handleRequest(payload: FileEditData[]): AsyncIterable<AppliableState> {
        const {logger, diffViewManager} = this.context;
        logger.info('Start', payload);

        const stack = this.ensureMeaningfulEditStack(payload);

        try {
            const appliable = await this.checkEditStckAppliable(stack);

            if (appliable !== 'appliable') {
                yield appliable;
                return;
            }

            const fileUri = this.resolveFileUri(stack.last.file);
            const edit = new WorkspaceEdit();
            const merged = this.mergeEditStack(stack);

            logger.trace('ApplyEdit');
            await this.applyEdit(merged, edit, fileUri);

            logger.trace('CloseDiffEditor');
            await diffViewManager.close(stack.last.file);

            if (merged.type !== 'delete') {
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

    private mergeEditStack(stack: MeaningfulEditStack): EditApplyInput {
        if (stack.first.type === 'create') {
            return {
                type: 'create',
                oldContent: '',
                newContent: stack.last.newContent,
            };
        }

        return {
            type: stack.last.type,
            oldContent: stack.first.oldContent,
            newContent: stack.last.newContent,
        };
    }

    private async applyEdit(payload: EditApplyInput, edit: WorkspaceEdit, uri: Uri) {
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
