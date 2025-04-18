import type {FileEditData} from '../patch';
import type {
    ToolName,
    ReadFileParameter,
    ReadDirectoryParameter,
    FindFilesByGlobParameter,
    FindFilesByRegExpParameter,
    WriteFileParameter,
    PatchFileParameter,
    DeleteFileParameter,
    RunCommandParameter,
    BrowserPreviewParameter,
    AttemptCompletionParameter,
    AskFollowupQuestionParameter,
    CompleteTaskParameter,
    CreatePlanParameter,
} from '../tool';

export type WorkflowSourceChunkStatus =
    | 'generating'
    | 'waitingValidate'
    | 'validateError'
    | 'validated';

export type WorkflowChunkStatus =
    | 'waitingApprove'
    | 'userApproved'
    | 'userRejected'
    | 'executing'
    | 'completed'
    | 'failed';

export type RawToolCallParameter = string | string[] | undefined;

export interface ToolCallMessageChunk {
    type: 'toolCall';
    toolName: ToolName;
    arguments: Record<string, RawToolCallParameter>;
    status: WorkflowSourceChunkStatus;
    source: string;
}

interface ParsedToolCallMessageChunkBase {
    type: 'parsedToolCall';
    status: WorkflowChunkStatus;
    source: string;
}

export interface ReadFileToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'read_file';
    arguments: ReadFileParameter;
}

export interface ReadDirectoryToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'read_directory';
    arguments: ReadDirectoryParameter;
}

export interface FindFilesByGlobToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'find_files_by_glob';
    arguments: FindFilesByGlobParameter;
}

export interface FindFilesByRegExpToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'find_files_by_regex';
    arguments: FindFilesByRegExpParameter;
}

export interface WriteFileToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'write_file';
    arguments: WriteFileParameter;
    executionData: FileEditData | null;
}

export interface PatchFileToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'patch_file';
    arguments: PatchFileParameter;
    executionData: FileEditData | null;
}

export interface DeleteFileToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'delete_file';
    arguments: DeleteFileParameter;
    executionData: FileEditData | null;
}

export interface RunCommandToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'run_command';
    arguments: RunCommandParameter;
}

export interface BrowserPreviewToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'browser_preview';
    arguments: BrowserPreviewParameter;
}

export interface AttemptCompletionToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'attempt_completion';
    arguments: AttemptCompletionParameter;
}

export interface AskFollowupQuestionToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'ask_followup_question';
    arguments: AskFollowupQuestionParameter;
}

export interface CompleteTaskToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'complete_task';
    arguments: CompleteTaskParameter;
}

export interface CreatePlanToolCallMessageChunk extends ParsedToolCallMessageChunkBase {
    toolName: 'create_plan';
    arguments: CreatePlanParameter;
}

export type ParsedToolCallMessageChunk =
    | ReadFileToolCallMessageChunk
    | ReadDirectoryToolCallMessageChunk
    | FindFilesByGlobToolCallMessageChunk
    | FindFilesByRegExpToolCallMessageChunk
    | WriteFileToolCallMessageChunk
    | PatchFileToolCallMessageChunk
    | DeleteFileToolCallMessageChunk
    | RunCommandToolCallMessageChunk
    | BrowserPreviewToolCallMessageChunk
    | AttemptCompletionToolCallMessageChunk
    | AskFollowupQuestionToolCallMessageChunk
    | CompleteTaskToolCallMessageChunk
    | CreatePlanToolCallMessageChunk;

type ParsedToolCallMessageChunkMap = { [K in ParsedToolCallMessageChunk as K['toolName']]: K };

export type ParsedToolCallMessageChunkOf<N extends ToolName> = ParsedToolCallMessageChunkMap[N];

export type FileEditToolCallMessageChunk =
    | WriteFileToolCallMessageChunk
    | PatchFileToolCallMessageChunk
    | DeleteFileToolCallMessageChunk;

export function isFileEditToolCallChunk(chunk: ParsedToolCallMessageChunk): chunk is FileEditToolCallMessageChunk {
    return chunk.toolName === 'write_file' || chunk.toolName === 'patch_file' || chunk.toolName === 'delete_file';
}
