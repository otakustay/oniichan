import path from 'node:path';
import {ChatToolPayload} from '@oniichan/shared/model';
import {EditorHost} from '../../editor';

export const tools: ChatToolPayload[] = [
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

    async callTool(name: string, args: unknown): Promise<unknown> {
        if (name === 'readDirectory') {
            const arg = args as PathArguments;
            const workspace = this.editorHost.getWorkspace();
            const root = await workspace.getRoot();
            if (root) {
                const children = await workspace.readDirectory(path.join(root, arg.path));
                return children.length > 200 ? children.slice(0, 200) : children;
            }
            return [];
        }
        if (name === 'readFile') {
            const arg = args as PathArguments;
            const workspace = this.editorHost.getWorkspace();
            const root = await workspace.getRoot();
            if (root) {
                const content = await workspace.readFile(path.join(root, arg.path));

                if (content.length > 30000) {
                    return '(This file is too large)';
                }

                return content;
            }
            return null;
        }
        throw new Error(`Unknown tool "${name}"`);
    }
}
