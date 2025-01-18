import dedent from 'dedent';
import {JSONSchema7} from 'json-schema';

export interface ParameterInfo {
    type: 'object';
    properties: Record<string, JSONSchema7>;
    required: string[];
    [k: string]: unknown;
}

export type ToolName = 'readFile' | 'readDirectory' | 'findFiles';

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
        name: 'readFile',
        description: `Read the content of a file, returns null if the file does not exist`,
        parameters: readFileParameters,
        usage: dedent`
                <readFile>
                    <path>src/utils/index.ts</path>
                </readFile>
            `,
    },
    {
        name: 'readDirectory',
        description: `Read the file and child directories in a directory`,
        parameters: readDirectoryParameters,
        usage: dedent`
            <readDirectory>
                <path>src/utils</path>
            </readDirectory>
        `,
    },
    {
        name: 'findFiles',
        description: `Find files matching a glob pattern`,
        parameters: findFilesParameters,
        usage: dedent`
            <findFiles>
                <glob>src/common/**/*.{ts,tsx}</glob>
            </findFiles>
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
    | ToolCallInputOf<'readDirectory', ReadDirectoryParameter>
    | ToolCallInputOf<'readFile', ReadFileParameter>
    | ToolCallInputOf<'findFiles', FindFilesParameter>;
