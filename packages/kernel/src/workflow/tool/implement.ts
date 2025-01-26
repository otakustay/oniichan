import path from 'node:path';
import {stringifyError} from '@oniichan/shared/error';
import {ToolCallInput} from '@oniichan/shared/tool';
import {assertNever} from '@oniichan/shared/error';
import {FileEntry} from '@oniichan/editor-host/protocol';
import {EditorHost} from '../../editor';

function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

// TODO: Should use JSON schema to validate the input
function errorMissingParameter(name: string) {
    return `Missing value for required parameter "${name}", this may be caused by empty content in <${name}> tag or missing <${name}> tag, please retry with complete response.`;
}

interface GenericToolCallInput {
    name: string;
}

export class ToolImplement {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        this.editorHost = editorHost;
    }

    async callTool(input: ToolCallInput): Promise<string> {
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
        if (!file) {
            return errorMissingParameter('path');
        }

        const workspace = this.editorHost.getWorkspace();
        try {
            const content = await workspace.readWorkspaceFile(file);

            if (content === null) {
                return `Unsable to read file ${file}: file not exists}`;
            }

            if (content === '') {
                return `File ${file} is an empty file`;
            }

            if (content.length > 30000) {
                return `Unable to read file ${file}: This file is too large`;
            }

            const language = path.extname(file).slice(1);
            return `Content of file ${file}:\n\n${codeBlock(content, language)}`;
        }
        catch (ex) {
            return `Unsable to read file ${file}: ${stringifyError(ex)}`;
        }
    }

    private async findFiles(glob: string) {
        if (!glob) {
            return errorMissingParameter('path');
        }

        const formatResult = (root: string, files: string[]) => {
            if (!files.length) {
                return `There is no file matching glob ${glob}`;
            }

            const lines = files.map(v => `- ${path.relative(root, v)}`);
            return `Files matching glob ${glob}:\n\n${lines.join('\n')}`;
        };
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();
            if (root) {
                const files = await workspace.findFiles(glob, 200);
                return formatResult(root, files);
            }
            return formatResult('', []);
        }
        catch (ex) {
            return `Unsable to find files with pattern ${glob}: ${stringifyError(ex)}`;
        }
    }

    private async readDirectory(directory: string) {
        if (!directory) {
            return errorMissingParameter('path');
        }

        const formatResult = (items: FileEntry[]) => {
            if (!items.length) {
                return `Directory ${directory} is empty`;
            }

            const lines = items.map(v => `- ${v.name}` + (v.type === 'directory' ? '/' : ''));
            return `Files in directory ${directory}, directories are followed by \`/\`:\n\n${lines.join('\n')}`;
        };
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();
            if (root) {
                const children = await workspace.readDirectory(path.join(root, directory));
                const items = children.length > 200 ? children.slice(0, 200) : children;
                return formatResult(items);
            }
            return formatResult([]);
        }
        catch (ex) {
            return `Unsable to read directory ${directory}: ${stringifyError(ex)}`;
        }
    }
}
