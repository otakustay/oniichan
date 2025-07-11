export {patchContent} from './patch.js';
export type {PatchAction, PatchResult} from './patch.js';
export {PatchParseError} from './parse.js';
export type {ParsedPatch} from './parse.js';
export {stackFileEdit} from './stack.js';
export {
    createFileEdit,
    mergeFileEdits,
    revertFileEdit,
    diffCount,
    findFirstEditLine,
} from './utils.js';
export type {
    FileEditAction,
    FileEditData,
    FileEditError,
    FileEditResult,
} from './utils.js';
