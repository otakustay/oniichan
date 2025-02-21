import {stringifyError} from '../error';
import {PatchAction, patchContent, PatchResult} from './patch';
import {PatchParseError} from './parse';
import {diffCount, FileEditAction, FileEditData} from './utils';

function applyEdit(action: PatchAction, oldContent: string, patch: string): PatchResult {
    switch (action) {
        case 'delete':
            return {
                newContent: '',
                deletedCount: oldContent.split('\n').length,
                insertedCount: 0,
            };
        case 'patch':
            return patchContent(oldContent, patch);
        case 'write':
            return {
                newContent: patch,
                ...diffCount(oldContent, patch),
            };
    }
}

function nextAction(previousEditAction: FileEditAction, patchAction: PatchAction): FileEditAction {
    if (previousEditAction === 'delete') {
        return patchAction === 'delete' ? 'delete' : 'create';
    }

    return patchAction === 'delete' ? 'delete' : 'edit';
}

export function stackFileEdit(previous: FileEditData, action: PatchAction, patch: string): FileEditData {
    if (previous.type === 'error') {
        return {
            type: 'error',
            errorType: 'unknown',
            file: previous.file,
            message: previous.errorType === 'patchError' ? 'Previous patch is invalid' : 'Previous patch is invalid',
        };
    }

    if (previous.type === 'delete' && action === 'patch') {
        return {
            type: 'error',
            errorType: 'conflict',
            file: previous.file,
            message: `Cannot patch deleted file`,
        };
    }

    try {
        return {
            file: previous.file,
            oldContent: previous.newContent,
            type: nextAction(previous.type, action),
            ...applyEdit(action, previous.newContent, patch),
        };
    }
    catch (ex) {
        return {
            type: 'error',
            errorType: ex instanceof PatchParseError ? 'patchError' : 'unknown',
            file: previous.file,
            message: stringifyError(ex),
        };
    }
}
