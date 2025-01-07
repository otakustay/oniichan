import {FromSchema} from 'json-schema-to-ts';

export const toolSchema = {
    readDirectory: {
        name: 'readDirectory',
        description: 'Read the file and child directories in a directory',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    description: 'The path to the directory you want to read, must be a relative path',
                    type: 'string',
                },
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
                    description: 'The path to the file you want to read, must be a relative path',
                    type: 'string',
                },
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
                    description: 'The glob pattern to match files',
                    type: 'string',
                },
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
