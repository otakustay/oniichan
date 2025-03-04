import {isAssistantMessage} from '@oniichan/shared/inbox';
import {diffCount, FileEditData, FileEditResult, revertFileEdit} from '@oniichan/shared/patch';
import {stringifyError} from '@oniichan/shared/error';
import {Message} from '../../inbox';
import {InboxMessageIdentity, InboxRequestHandler} from './handler';

interface InboxRollbackAppliable {
    file: string;
    state: 'appliable';
    edit: FileEditResult;
}

interface InboxRollbackConflict {
    file: string;
    state: 'conflict';
    edit: FileEditResult;
}

interface InboxRollbackError {
    file: string;
    state: 'error';
    edit: FileEditResult | null;
}

export type InboxRollbackCheckItem = InboxRollbackAppliable | InboxRollbackConflict | InboxRollbackError;

export interface InboxCheckRollbackResponse {
    roundtripCount: number;
    affected: InboxRollbackCheckItem[];
}

export class InboxCheckRollbackHandler extends InboxRequestHandler<InboxMessageIdentity, InboxCheckRollbackResponse> {
    static readonly action = 'inboxCheckRollback';

    async *handleRequest(payload: InboxMessageIdentity): AsyncIterable<InboxCheckRollbackResponse> {
        const {store, logger} = this.context;
        logger.info('Start');

        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        const affected = thread.sliceRoundtripAfter(payload.messageUuid);
        const reverting = affected.flatMap(v => v.toMessages()).reverse().filter(v => isAssistantMessage(v.type));

        if (!reverting.length) {
            logger.error('RollbackToLatest');
            throw new Error('Unable to rollback to latest assistant message');
        }

        try {
            const fileEdits = this.computeRollbackFileEdits(reverting);
            const items = await Promise.all(fileEdits.map(v => this.toCheckItem(v)));
            yield {
                roundtripCount: affected.length,
                affected: items.filter(v => !!v),
            };

            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            throw ex;
        }
    }

    private computeRollbackFileEdits(messages: Message[]) {
        const files: Record<string, FileEditData[]> = {};
        const edits = messages.flatMap(v => v.type === 'toolCall' && v.getFileEdit() || []);
        for (const edit of edits) {
            const fileEdits = files[edit.file] ?? [];
            fileEdits.push(edit.type === 'error' ? edit : revertFileEdit(edit));
            files[edit.file] = fileEdits;
        }
        return Object.values(files);
    }

    private async createFileEdit(targetEdit: FileEditResult): Promise<FileEditResult | null> {
        const {editorHost} = this.context;

        const currentContent = await editorHost.call('readWorkspaceFile', targetEdit.file);
        const targetContent = targetEdit.type === 'delete' ? null : targetEdit.newContent;

        if (currentContent === targetContent) {
            return null;
        }

        if (currentContent === null) {
            return {
                file: targetEdit.file,
                type: 'create',
                oldContent: '',
                newContent: targetEdit.newContent,
                deletedCount: 0,
                insertedCount: targetEdit.newContent.split('\n').length,
            };
        }

        if (targetEdit.type === 'delete') {
            return {
                file: targetEdit.file,
                type: 'delete',
                oldContent: currentContent,
                newContent: '',
                deletedCount: currentContent.split('\n').length,
                insertedCount: 0,
            };
        }

        return {
            file: targetEdit.file,
            type: 'edit',
            oldContent: currentContent ?? '',
            newContent: targetEdit.newContent,
            ...diffCount(currentContent, targetEdit.newContent),
        };
    }

    private async toCheckItem(stack: FileEditData[]): Promise<InboxRollbackCheckItem | null> {
        const target = stack.at(-1);

        if (!target) {
            return null;
        }

        if (target.type === 'error') {
            return {
                file: target.file,
                state: 'error',
                edit: null,
            };
        }

        const edit = await this.createFileEdit(target);

        if (!edit) {
            return null;
        }

        const meaningfulEdits = stack.filter(v => v.type !== 'error');

        if (meaningfulEdits.length < stack.length) {
            return {
                file: target.file,
                state: 'error',
                edit,
            };
        }

        // Deleted files can always rollback, just create it
        if (target.type === 'create') {
            return {
                file: target.file,
                state: 'appliable',
                edit,
            };
        }

        const appliable = meaningfulEdits.some(v => v.oldContent === edit.oldContent);
        return {
            file: target.file,
            state: appliable ? 'appliable' : 'conflict',
            edit,
        };
    }
}

export class InboxRollbackHandler extends InboxRequestHandler<InboxMessageIdentity, void> {
    static readonly action = 'inboxRollback';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: InboxMessageIdentity): AsyncIterable<void> {
        const {store, logger} = this.context;
        logger.info('Start');

        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        thread.rollbackRoundtripTo(payload.messageUuid);
        this.pushStoreUpdate(thread.uuid);

        logger.info('Finish');
    }
}
