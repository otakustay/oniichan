import path from 'node:path';
import {readFileParameters, ReadFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase} from './utils';

export class ReadFileToolImplement extends ToolImplementBase<ReadFileParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, readFileParameters);
    }

    protected parseArgs(args: Record<string, string>): Record<string, unknown> {
        return {
            path: args.path,
        };
    }

    protected async execute(args: ReadFileParameter): Promise<string> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const content = await workspace.readWorkspaceFile(args.path);

            if (content === null) {
                return `Unsable to read file ${args.path}: file not exists}`;
            }

            if (content === '') {
                return `File ${args.path} is an empty file`;
            }

            if (content.length > 30000) {
                return `Unable to read file ${args.path}: This file is too large`;
            }

            const language = path.extname(args.path).slice(1);
            return resultMarkdown('Content of file ${args.path}:', content, language);
        }
        catch (ex) {
            return `Unsable to read file ${args.path}: ${stringifyError(ex)}`;
        }
    }
}
