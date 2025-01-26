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
];

export function isToolName(name: string): name is ToolName {
    return builtinTools.some(tool => tool.name === name);
}

export interface ModelToolCallInput {
    name: ToolName;
    arguments: Record<string, string>;
}
