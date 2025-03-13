export {patchContent} from './patch';
export type {PatchAction, PatchResult} from './patch';
export {PatchParseError} from './parse';
export type {ParsedPatch} from './parse';
export {stackFileEdit} from './stack';
export {
    createFileEdit,
    mergeFileEdits,
    revertFileEdit,
    diffCount,
} from './utils';
export type {
    FileEditAction,
    FileEditData,
    FileEditError,
    FileEditResult,
} from './utils';
