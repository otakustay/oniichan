import {diffLines} from 'diff';
import {stringifyError} from '../error';
import {PatchAction, patchContent, PatchResult} from './patch';
import {PatchParseError} from './parse';

export type FileEditAction = 'create' | 'delete' | 'edit';

export interface FileEditResult {
    type: FileEditAction;
    file: string;
    oldContent: string;
    newContent: string;
    deletedCount: number;
    insertedCount: number;
}

export interface FileEditError {
    type: 'error';
    errorType: 'patchError' | 'conflict' | 'parameterError' | 'unknown';
    file: string;
    message: string;
}

export type FileEditData = FileEditResult | FileEditError;

function diffCount(oldContent: string, newContent: string) {
    const diff = diffLines(oldContent, newContent);
    return diff.reduce(
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
}

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

export function createFileEdit(file: string, content: string | null, action: PatchAction, patch: string): FileEditData {
    const mockEdit: FileEditData = {
        file,
        type: content === null ? 'delete' : 'create',
        oldContent: '',
        newContent: content ?? '',
        deletedCount: 0,
        insertedCount: 0,
    };
    return stackFileEdit(mockEdit, action, patch);
}
