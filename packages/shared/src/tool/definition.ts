import dedent from 'dedent';
import type {JSONSchema7} from 'json-schema';
import type {RawToolCallParameter, AssistantRole, MessageThreadWorkingMode} from '../inbox';

export interface ParameterInfo {
    type: 'object';
    properties: Record<string, JSONSchema7>;
    required: string[];
    [k: string]: unknown;
}

export type ToolName =
    | 'read_file'
    | 'read_directory'
    | 'find_files_by_glob'
    | 'find_files_by_regex'
    | 'write_file'
    | 'patch_file'
    | 'delete_file'
    | 'run_command'
    | 'browser_preview'
    | 'attempt_completion'
    | 'ask_followup_question'
    | 'complete_task'
    | 'create_plan';

export interface ToolDescription {
    name: ToolName;
    description: string;
    parameters: ParameterInfo;
    usage: string;
    role: AssistantRole[];
    mode?: MessageThreadWorkingMode[];
}

export const readFileParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'array',
            description: 'The paths to the files you want to read, must be a relative path',
            items: {
                type: 'string',
            },
        },
    },
    required: ['path'],
} as const satisfies ParameterInfo;

export interface ReadFileParameter {
    paths: string[];
}

export const readDirectoryParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the directory you want to read, must be a relative path',
        },
        recursive: {
            type: 'boolean',
            description: 'Whether to recursively read the directory',
        },
    },
    required: ['path'],
} as const satisfies ParameterInfo;

export interface ReadDirectoryParameter {
    path: string;
    recursive?: boolean;
}

export const findFilesByGlobParameters = {
    type: 'object',
    properties: {
        glob: {
            type: 'string',
            description: 'The glob pattern to match files',
        },
    },
    required: ['glob'],
} as const satisfies ParameterInfo;

export interface FindFilesByGlobParameter {
    glob: string;
}

export const findFilesByRegExpParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the directory you want to search for, must be a relative path',
        },
        regex: {
            type: 'string',
            description: 'A regular expression to match file content',
        },
        glob: {
            type: 'string',
            description:
                'Glob pattern to match searched files, search for all text files when this parameter is not provided',
        },
    },
    required: ['path', 'regex'],
} as const satisfies ParameterInfo;

export interface FindFilesByRegExpParameter {
    path: string;
    regex: string;
    glob?: string;
}

export const writeFileParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the file you want to write, must be a relative path',
        },
        content: {
            type: 'string',
            description:
                'The full content of the file, DO NOT lose anything in content, DO NOT use comments like "// existing..." to omit content',
        },
    },
    required: ['path', 'content'],
} as const satisfies ParameterInfo;

export interface WriteFileParameter {
    path: string;
    content: string;
}

export const patchFileParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the file you want to patch, must be a relative path',
        },
        patch: {
            type: 'string',
            description: dedent`
                One or more patch blocks exactly in the format illustrated below:
                \`\`\`
                <<<<<<< SEARCH
                [Exact content to search]
                =======
                [New content to replace with]
                >>>>>>> REPLACE
                \`\`\`
                Rules for search and replace:
                1. \`SEARCH\` content must exactly match what in original file, including whitespace, indentation and line endings.
                2. Keep \`SEARCH\` part minimum, only include surrounding unmodified context lines if needed to locate content uniquely.
                3. Use multiple patch blocks if multiple parts of the file need to be modified.
                4. Use small patch blocks, split into multiple blocks if one includes unchanged lines in the middle.
                5. To move code, use two patch blocks, one to delete the original code and another to add it in a new location.
                6. To delete code, use a patch block with \`REPLACE\` part empty.
            `,
        },
    },
    required: ['path', 'patch'],
} as const satisfies ParameterInfo;

export interface PatchFileParameter {
    path: string;
    patch: string;
}

export const deleteFileParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the file you want to delete, must be a relative path',
        },
    },
    required: ['path'],
} as const satisfies ParameterInfo;

export interface DeleteFileParameter {
    path: string;
}

export const browserPreviewParameters = {
    type: 'object',
    properties: {
        url: {
            type: 'string',
            description: 'The URL to open in the browser preview window',
        },
    },
    required: ['url'],
} as const satisfies ParameterInfo;

export interface BrowserPreviewParameter {
    url: string;
}

export const runCommandParameters = {
    type: 'object',
    properties: {
        command: {
            type: 'string',
            description: 'The command to run, must be a valid shell command',
        },
    },
    required: ['command'],
} as const satisfies ParameterInfo;

export interface RunCommandParameter {
    command: string;
}

export const askFollowupQuestionParameters = {
    type: 'object',
    properties: {
        question: {
            type: 'string',
            description:
                'The question to ask the user. This should be a clear, specific question that addresses the information you need',
        },
    },
    required: ['question'],
} as const satisfies ParameterInfo;

export interface AskFollowupQuestionParameter {
    question: string;
}

export const attemptCompletionParameters = {
    type: 'object',
    properties: {
        result: {
            type: 'string',
            description: 'Your final result to user\'s request',
        },
        command: {
            type: 'string',
            description: 'Command to demonstrate result',
        },
    },
    required: ['result'],
} as const satisfies ParameterInfo;

export interface AttemptCompletionParameter {
    result: string;
    command?: string;
}

export const completeTaskParameters = {
    type: 'object',
    properties: {
        confidence: {
            type: 'number',
            description:
                'The confidence value as you regard yourself completely fulfilled this task, an integer from 0 to 100, larger number means more confident',
        },
    },
    required: ['confidence'],
} as const satisfies ParameterInfo;

export interface CompleteTaskParameter {
    confidence: number;
}

export const createPlanParameters = {
    type: 'object',
    properties: {
        read: {
            type: 'array',
            description:
                'One or more tasks related to plan envolving gathering information from project, including reading files, directories and searching for specific patterns',
            items: {
                type: 'string',
            },
        },
        coding: {
            type: 'array',
            description:
                'One or more tasks related to plan envolving editing project, including creating, modifying, deleteing files and running terminal commands',
            items: {
                type: 'string',
            },
        },
    },
    required: [],
} as const satisfies ParameterInfo;

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

export const builtinTools: ToolDescription[] = [
    {
        name: 'read_file',
        description: `Read the content of a file`,
        parameters: readFileParameters,
        usage: dedent`
            <read_file>
                <path>src/utils/index.ts</path>
            </read_file>
        `,
        role: ['standalone', 'actor', 'coder'],
    },
    {
        name: 'read_directory',
        description: `Read the file and child directories in a directory, at most 2000 files will be returned`,
        parameters: readDirectoryParameters,
        usage: dedent`
            <read_directory>
                <path>src/utils</path>
                <recursive>true</recursive>
            </read_directory>
        `,
        role: ['standalone', 'actor', 'coder'],
    },
    {
        name: 'find_files_by_glob',
        description: `Find files matching a glob pattern`,
        parameters: findFilesByGlobParameters,
        usage: dedent`
            <find_files_by_glob>
                <glob>src/common/**/*.{ts,tsx}</glob>
            </find_files_by_glob>
        `,
        role: ['standalone', 'actor', 'coder'],
    },
    {
        name: 'find_files_by_regex',
        description: 'Find files matching a regular expression',
        parameters: findFilesByRegExpParameters,
        usage: dedent`
            <find_files_by_regex>
                <regex>export function [A-Z][a-zA-Z0-9]*\(</regex>
                <path>src/common</path>
            </find_files_by_regex>
        `,
        role: ['standalone', 'actor', 'coder'],
    },
    {
        name: 'write_file',
        description: `Write content to a file, creates the file if it does not exist`,
        parameters: writeFileParameters,
        usage: dedent`
            <write_file>
                <path>src/greeting.ts</path>
                <content>
                export function hello() {
                    return "hello";
                }
                </content>
            </write_file>
        `,
        role: ['standalone', 'coder'],
    },
    {
        name: 'patch_file',
        description: 'Patch a file with one or more patch blocks in special format',
        parameters: patchFileParameters,
        usage: dedent`
            <patch_file>
                <path>src/utils/index.ts</path>
                <patch>
                <<<<<<< SEARCH
                @media (prefers-color-scheme: light) {
                    color: #000;
                =======
                @media (prefers-color-scheme: dark) {
                    color: #fff;
                >>>>>>> REPLACE
                </patch>
            </patch_file>
        `,
        role: ['standalone', 'coder'],
    },
    {
        name: 'delete_file',
        description: 'Delete a file from the workspace',
        parameters: deleteFileParameters,
        usage: dedent`
            <delete_file>
                <path>src/old-file.ts</path>
            </delete_file>
        `,
        role: ['standalone', 'coder'],
    },
    {
        name: 'browser_preview',
        description:
            'Open a URL in browser to preview current application, be sure the URL is accessible before using this tool',
        parameters: browserPreviewParameters,
        usage: dedent`
            <browser_preview>
                <url>https://example.com</url>
            </browser_preview>
        `,
        role: ['standalone', 'actor', 'coder'],
    },
    {
        name: 'run_command',
        description:
            `Execute a CLI command on the system. To operate with system and perform tasks that are not covered by other tools, use this tool with a clear explanation of what the command does.`,
        parameters: runCommandParameters,
        usage: dedent`
            <run_command>
                <command>ls -la</command>
            </run_command>
        `,
        role: ['standalone', 'coder'],
    },
    {
        name: 'attempt_completion',
        description:
            'When you confirm the user request is completed, use this tool to present the result of your work to the user, it\'s better to also have an instruction about how to verify the result. Optionally you may provide a CLI command to showcase the result of your work.',
        parameters: attemptCompletionParameters,
        usage: dedent`
            <attempt_completion>
                <result>The result of your completion</result>
                <command>The command you used to demonstrate the result</command>
            </attempt_completion>
        `,
        role: ['standalone', 'planner'],
    },
    {
        name: 'ask_followup_question',
        description:
            'Ask the user a question to gather additional information needed to complete the task. This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. It allows for interactive problem-solving by enabling direct communication with the user. Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth',
        parameters: askFollowupQuestionParameters,
        usage: dedent`
            <ask_followup_question>
                <question>Your question</question>
            </ask_followup_question>
        `,
        role: ['standalone'],
        mode: ['normal'],
    },
    {
        name: 'complete_task',
        description:
            'When you confirm the task given is completed, use this tool to finish your work, provide a confidence value. This tool is a hidden tool, user will not get any insight when this tool get executed, so do not leak the tool name or its paramters outside the tool call XML tag.',
        parameters: completeTaskParameters,
        usage: dedent`
            <complete_task>
                <confidence>87</confidence>
            </complete_task>
        `,
        role: ['actor', 'coder'],
        mode: ['ringRing'],
    },
    {
        name: 'create_plan',
        description: 'Create a plan containing one or more tasks, tasks will be picked and executed afterwards.',
        parameters: createPlanParameters,
        usage: dedent`
            <create_plan>
            <read>Search for usage of debounce function</read>
            <read>Read package.json to see if lodash is installed</read>
            <coding>Delete file debounce.ts</coding>
            <coding>Remove import of debounce from index.ts</coding>
            <coding>Uninstall lodash</coding>
            </create_plan>
        `,
        role: ['planner'],
        mode: ['ringRing'],
    },
];

export function isToolName(name: string): name is ToolName {
    return builtinTools.some(tool => tool.name === name);
}

export function isEditToolName(name: ToolName) {
    return name === 'delete_file' || name === 'patch_file' || name === 'write_file';
}

export interface ModelToolCallInput {
    name: ToolName;
    arguments: Record<string, RawToolCallParameter>;
}

export interface ModelToolCallInputWithSource extends ModelToolCallInput {
    source: string;
}
