import path from 'node:path';
import {stringifyError} from '@oniichan/shared/error';
import {ToolName, ToolParameter, toolSchema} from '@oniichan/shared/tool';
import {assertNever} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';

interface ToolCallInputOf<K> {
    name: K;
    arguments: K extends ToolName ? ToolParameter<K> : unknown;
}

export type ToolCallInput =
    | ToolCallInputOf<'readDirectory'>
    | ToolCallInputOf<'readFile'>
    | ToolCallInputOf<'findFiles'>;

interface GenericToolCallInput {
    name: string;
}

export class ToolImplement {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        this.editorHost = editorHost;
    }

    getBuiltinTools() {
        return Object.values(toolSchema);
    }

    async callTool(input: ToolCallInput): Promise<unknown> {
        switch (input.name) {
            case 'readDirectory':
                return this.readDirectory(input.arguments.path);
            case 'readFile':
                return this.readFile(input.arguments.path);
            case 'findFiles':
                return this.findFiles(input.arguments.glob);
            default:
                assertNever<GenericToolCallInput>(input, v => `Unknown tool "${v.name}"`);
        }
    }

    private async readFile(file: string) {
        const workspace = this.editorHost.getWorkspace();
        try {
            const content = await workspace.readWorkspaceFile(file);

            if (content === null) {
                return `Unsable to read file ${file}: file not exists}`;
            }

            if (content.length > 30000) {
                return `Unable to read file ${file}: This file is too large`;
            }

            return content;
        }
        catch (ex) {
            return `Unsable to read file ${file}: ${stringifyError(ex)}`;
        }
    }

    private async findFiles(glob: string) {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();
            if (root) {
                const files = await workspace.findFiles(glob, 200);
                return files.map(v => path.relative(root, v));
            }
            return [];
        }
        catch (ex) {
            return `Unsable to find files with pattern ${glob}: ${stringifyError(ex)}`;
        }
    }

    private async readDirectory(directory: string) {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();
            if (root) {
                const children = await workspace.readDirectory(path.join(root, directory));
                return children.length > 200 ? children.slice(0, 200) : children;
            }
            return [];
        }
        catch (ex) {
            return `Unsable to read directory ${directory}: ${stringifyError(ex)}`;
        }
    }
}
