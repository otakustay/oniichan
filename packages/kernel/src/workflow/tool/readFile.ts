import path from 'node:path';
import {readFileParameters, ReadFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

export class ReadFileToolImplement extends ToolImplementBase<ReadFileParameter> {
    constructor(init: ToolImplementInit) {
        super('ReadFileToolImplement', init, readFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
        };
    }

    protected async execute(args: ReadFileParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const content = await workspace.readWorkspaceFile(args.path);

            if (content === null) {
                return {
                    type: 'success',
                    finished: false,
                    output: `Unable to read file ${args.path}: file not exists`,
                };
            }

            if (content === '') {
                return {
                    type: 'success',
                    finished: false,
                    output: `File ${args.path} is an empty file`,
                };
            }

            if (content.length > 30000) {
                return {
                    type: 'success',
                    finished: false,
                    output: `Unable to read file ${args.path}: This file is too large`,
                };
            }

            const language = path.extname(args.path).slice(1);
            return {
                type: 'success',
                finished: false,
                output: resultMarkdown(`Content of file ${args.path}:`, content, language),
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unable to read file ${args.path}: ${stringifyError(ex)}`,
            };
        }
    }
}
