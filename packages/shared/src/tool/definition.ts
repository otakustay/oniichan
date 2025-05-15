import type {JSONSchema7} from 'json-schema';
import type {RawToolCallParameter, AssistantRole, MessageThreadWorkingMode} from '../inbox';

export interface ParameterInfo {
    type: 'object';
    properties: Record<string, JSONSchema7>;
    required: string[];
    [k: string]: unknown;
}

const toolNames = [
    'read_file',
    'read_directory',
    'find_files_by_glob',
    'find_files_by_regex',
    'write_file',
    'patch_file',
    'delete_file',
    'run_command',
    'browser_preview',
    'attempt_completion',
    'ask_followup_question',
    'complete_task',
    'create_plan',
    'semantic_edit_code',
] as const;

export type ToolName = typeof toolNames[number];

export function isToolName(name: string): name is ToolName {
    // type guard function
    return toolNames.includes(name as ToolName);
}

export function isEditToolName(name: ToolName) {
    return name === 'delete_file' || name === 'patch_file' || name === 'write_file';
}

/**
 * Some tools represents a breakpoint in a roundtrip, which means we can switch role after this tool call.
 *
 * @param name The name of tool
 * @returns If the tool name represents a breakpoint in a single roundtrip
 */
export function isBreakpointToolName(name: ToolName) {
    return name === 'attempt_completion'
        || name === 'complete_task'
        || name === 'create_plan'
        || name === 'semantic_edit_code';
}

export type ToolSupportTarget = AssistantRole | [mode: MessageThreadWorkingMode, role: AssistantRole];

export interface ToolDescription {
    name: ToolName;
    description: string;
    parameters: ParameterInfo;
    usage: string;
    // TODO: remove supported property
    supported?: ToolSupportTarget[];
}

export interface ReadFileParameter {
    paths: string[];
}

export interface ReadDirectoryParameter {
    path: string;
    recursive?: boolean;
}

export interface FindFilesByGlobParameter {
    glob: string;
}

export interface FindFilesByRegExpParameter {
    path: string;
    regex: string;
    glob?: string;
}

export interface WriteFileParameter {
    path: string;
    content: string;
}

export interface PatchFileParameter {
    path: string;
    patches: string[];
}

export interface DeleteFileParameter {
    path: string;
}

export interface BrowserPreviewParameter {
    url: string;
}

export interface RunCommandParameter {
    command: string;
}

export interface AskFollowupQuestionParameter {
    question: string;
}

export interface AttemptCompletionParameter {
    result: string;
    command?: string;
}

export interface CompleteTaskParameter {
    confidence: number;
}

export type PlanTaskType = 'read' | 'coding';

export type PlanTaskStatus = 'generating' | 'pending' | 'executing' | 'completed';

export interface PlanTask {
    taskType: PlanTaskType;
    text: string;
    status: PlanTaskStatus;
}

export interface CreatePlanParameter {
    tasks: PlanTask[];
}

export interface SemanticEditCodeParameter {
    requirement: string;
}

export interface ModelToolCallInput {
    name: ToolName;
    arguments: Record<string, RawToolCallParameter>;
}

export interface ModelToolCallInputWithSource extends ModelToolCallInput {
    source: string;
}
