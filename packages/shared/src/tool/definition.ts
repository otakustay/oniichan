import dedent from 'dedent';
import {JSONSchema7} from 'json-schema';

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
    | 'search_codebase'
    | 'attempt_completion';

export interface ToolDescription {
    name: ToolName;
    description: string;
    parameters: ParameterInfo;
    usage: string;
}

export const readFileParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the directory you want to read, must be a relative path',
        },
    },
    required: ['path'],
} as const satisfies ParameterInfo;

export interface ReadFileParameter {
    path: string;
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
        // TODO: Native `grep` doesn't support glob
        // glob: {
        //     type: 'string',
        //     description: 'Glob pattern to match files, search for all text files when this parameter is not provided',
        // },
    },
    required: ['path', 'regex'],
} as const satisfies ParameterInfo;

export interface FindFilesByRegExpParameter {
    path: string;
    regex: string;
    // TODO: Native `grep` doesn't support glob
    // glob?: string;
}

export const searchEmbeddingParameters = {
    type: 'object',
    properties: {
        query: {
            type: 'string',
            description: 'A natural language query to search in codebase',
        },
    },
    required: ['query'],
} as const satisfies ParameterInfo;

export interface SearchEmbeddingParameter {
    query: string;
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

export const builtinTools: ToolDescription[] = [
    {
        name: 'read_file',
        description: `Read the content of a file, returns null if the file does not exist`,
        parameters: readFileParameters,
        usage: dedent`
                <read_file>
                    <path>src/utils/index.ts</path>
                </read_file>
            `,
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
    },
    {
        // TODO: Native `grep` doesn't support glob
        name: 'find_files_by_regex',
        description: 'Find files matching a regular expression',
        parameters: findFilesByRegExpParameters,
        usage: dedent`
            <find_files_by_regex>
                <path>src/common</path>
                <regex>export function [A-Z][a-zA-Z0-9]*\(</regex>
            </find_files_by_regex>
        `,
    },
    {
        name: 'search_codebase',
        description:
            'Search for codebase with a natural language query, returns chunks with filename, line range and code content',
        parameters: searchEmbeddingParameters,
        usage: dedent`
            <search_codebase>
                <query>function which validate whether a string is a valid email</query>
            </search_codebase>
        `,
    },
    {
        name: 'attempt_completion',
        description:
            `When you confirm the user request is completed, use this tool to present the result of your work to the user. Optionally you may provide a CLI command to showcase the result of your work.`,
        parameters: attemptCompletionParameters,
        usage: dedent`
            <attempt_completion>
                <result>The result of your completion</result>
                <command>The command you used to demonstrate the result</command>
            </attempt_completion>
        `,
    },
];

export function isToolName(name: string): name is ToolName {
    return builtinTools.some(tool => tool.name === name);
}

export interface ModelToolCallInput {
    name: ToolName;
    arguments: Record<string, string>;
}
