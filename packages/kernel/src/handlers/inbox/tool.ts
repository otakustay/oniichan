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
    {
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
];

interface PathArguments {
    path: string;
}

interface GlobArguments {
    glob: string;
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
                const content = await workspace.readWorkspaceFile(arg.path);

                if (content === null) {
                    return `Unsable to read file ${arg.path}: file not exists}`;
                }

                if (content.length > 30000) {
                    return `Unable to read file ${arg.path}: This file is too large`;
                }

                return content;
            }
            catch (ex) {
                return `Unsable to read file ${arg.path}: ${stringifyError(ex)}`;
            }
        }
        if (name === 'findFiles') {
            const arg = args as GlobArguments;
            const workspace = this.editorHost.getWorkspace();
            try {
                const root = await workspace.getRoot();
                if (root) {
                    const files = await workspace.findFiles(arg.glob, 200);
                    return files.map(v => path.relative(root, v));
                }
                return [];
            }
            catch (ex) {
                return `Unsable to find files with pattern ${arg.glob}: ${stringifyError(ex)}`;
            }
        }
        throw new Error(`Unknown tool "${name}"`);
    }
}
