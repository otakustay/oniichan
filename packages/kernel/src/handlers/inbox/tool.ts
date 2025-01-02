import path from 'node:path';
import {ChatToolPayload} from '@oniichan/shared/model';
import {stringifyError} from '@oniichan/shared/string';
import {EditorHost} from '../../editor';

const tools: ChatToolPayload[] = [
    {
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
    {
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
];

interface PathArguments {
    path: string;
}

export class ToolImplement {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        this.editorHost = editorHost;
    }

    getBuiltinTools() {
        return tools;
    }

    async callTool(name: string, args: unknown): Promise<unknown> {
        if (name === 'readDirectory') {
            const arg = args as PathArguments;
            const workspace = this.editorHost.getWorkspace();
            try {
                const root = await workspace.getRoot();
                if (root) {
                    const children = await workspace.readDirectory(path.join(root, arg.path));
                    return children.length > 200 ? children.slice(0, 200) : children;
                }
                return [];
            }
            catch (ex) {
                return `Unsable to read directory ${arg.path}: ${stringifyError(ex)}`;
            }
        }
        if (name === 'readFile') {
            const arg = args as PathArguments;
            const workspace = this.editorHost.getWorkspace();
            try {
                const root = await workspace.getRoot();
                if (root) {
                    const content = await workspace.readFile(path.join(root, arg.path));

                    if (content.length > 30000) {
                        return `Unable to read file ${arg.path}: This file is too large`;
                    }

                    return content;
                }
                return null;
            }
            catch (ex) {
                return `Unsable to read file ${arg.path}: ${stringifyError(ex)}`;
            }
        }
        throw new Error(`Unknown tool "${name}"`);
    }
}
