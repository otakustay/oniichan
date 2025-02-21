import {diffLines} from 'diff';
import {PatchAction} from './patch';
import {stackFileEdit} from './stack';

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

export function diffCount(oldContent: string, newContent: string) {
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

// TODO: Continuous delete edits is merged into a new edit with insert lines
export function mergeFileEdits(edits: FileEditData[]): FileEditData {
    const merge = (x: FileEditData, y: FileEditData): FileEditData => {
        if (y.type === 'error' || y.type === 'delete' || y.type === 'create') {
            return y;
        }

        if (x.type === 'error') {
            return {
                type: 'error',
                errorType: 'unknown',
                file: x.file,
                message: x.errorType === 'patchError' ? 'Previous patch is invalid' : 'Previous patch is invalid',
            };
        }

        return {
            type: x.type === 'create' ? 'create' : 'edit',
            file: x.file,
            oldContent: x.oldContent,
            newContent: y.newContent,
            ...diffCount(x.oldContent, y.newContent),
        };
    };
    return edits.reduce(merge);
}

export function revertFileEdit(edit: FileEditResult): FileEditResult {
    return {
        type: edit.type === 'create' ? 'delete' : (edit.type === 'delete' ? 'create' : 'edit'),
        file: edit.file,
        oldContent: edit.newContent,
        newContent: edit.oldContent,
        deletedCount: edit.insertedCount,
        insertedCount: edit.deletedCount,
    };
}
