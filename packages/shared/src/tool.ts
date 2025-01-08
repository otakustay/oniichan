import {FromSchema} from 'json-schema-to-ts';

const reasonParameter = {
    type: 'string',
    description:
        'The reason why you want to take this action, in markdown format and in first-person perspective, end with the correct punctuation',
} as const;

export const toolSchema = {
    readDirectory: {
        name: 'readDirectory',
        description: 'Read the file and child directories in a directory',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the directory you want to read, must be a relative path',
                },
                reason: reasonParameter,
            },
            required: ['path'],
        },
    },
    readFile: {
        name: 'readFile',
        description: 'Read the content of a file, returns null if the file does not exist',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the file you want to read, must be a relative path',
                },
                reason: reasonParameter,
            },
            required: ['path'],
        },
    },
    findFiles: {
        name: 'findFiles',
        description: 'Find files in workspace by glob pattern, some files like node_modules are ignored by default',
        parameters: {
            type: 'object',
            properties: {
                glob: {
                    type: 'string',
                    description: 'The glob pattern to match files',
                },
                reason: reasonParameter,
            },
            required: ['glob'],
        },
    },
} as const;

export function isToolName(name: string): name is ToolName {
    return Object.hasOwn(toolSchema, name);
}

export type ToolName = keyof typeof toolSchema;

export type ToolParameter<K extends ToolName> = FromSchema<typeof toolSchema[K]['parameters']>;

interface ToolUsage<K extends ToolName> {
    id: string;
    type: K;
    args: ToolParameter<K>;
}

export type MessageReadFileUsage = ToolUsage<'readFile'>;

export type MessageReadDirectoryUsage = ToolUsage<'readDirectory'>;

export type MessageFindFilesUsage = ToolUsage<'findFiles'>;

export type MessageToolUsage = MessageReadFileUsage | MessageReadDirectoryUsage | MessageFindFilesUsage;
