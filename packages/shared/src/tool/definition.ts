import dedent from 'dedent';
import {JSONSchema7} from 'json-schema';

export interface ParameterInfo {
    type: 'object';
    properties: Record<string, JSONSchema7>;
    required: string[];
    [k: string]: unknown;
}

export type ToolName = 'read_file' | 'read_directory' | 'find_files_by_glob';

export interface ToolDescription {
    name: ToolName;
    description: string;
    parameters: ParameterInfo;
    usage: string;
}

const readFileParameters = {
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

const readDirectoryParameters = {
    type: 'object',
    properties: {
        path: {
            type: 'string',
            description: 'The path to the directory you want to read, must be a relative path',
        },
    },
    required: ['path'],
} as const satisfies ParameterInfo;

export interface ReadDirectoryParameter {
    path: string;
}

const findFilesParameters = {
    type: 'object',
    properties: {
        glob: {
            type: 'string',
            description: 'The glob pattern to match files',
        },
    },
    required: ['glob'],
} as const satisfies ParameterInfo;

export interface FindFilesParameter {
    glob: string;
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
        description: `Read the file and child directories in a directory`,
        parameters: readDirectoryParameters,
        usage: dedent`
            <read_directory>
                <path>src/utils</path>
            </read_directory>
        `,
    },
    {
        name: 'find_files_by_glob',
        description: `Find files matching a glob pattern`,
        parameters: findFilesParameters,
        usage: dedent`
            <find_files_by_glob>
                <glob>src/common/**/*.{ts,tsx}</glob>
            </find_files_by_glob>
        `,
    },
];

export function isToolName(name: string): name is ToolName {
    return builtinTools.some(tool => tool.name === name);
}

interface ToolCallInputOf<N extends ToolName, P> {
    name: N;
    arguments: P;
}

export type ToolCallInput =
    | ToolCallInputOf<'read_directory', ReadDirectoryParameter>
    | ToolCallInputOf<'read_file', ReadFileParameter>
    | ToolCallInputOf<'find_files_by_glob', FindFilesParameter>;
