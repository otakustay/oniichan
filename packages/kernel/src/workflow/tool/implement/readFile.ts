import path from 'node:path';
import {ReadFileParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {ToolImplementBase, ToolExecuteResult} from './base';
import {resultMarkdown} from '../utils';

export class ReadFileToolImplement extends ToolImplementBase<ReadFileParameter> {
    extractParameters(generated: Record<string, string | undefined>): Partial<ReadFileParameter> {
        return {
            path: generated.path?.trim(),
        };
    }

    async executeApprove(args: ReadFileParameter): Promise<ToolExecuteResult> {
        try {
            const content = await this.editorHost.call('readWorkspaceFile', args.path);

            if (content === null) {
                return {
                    type: 'success',
                    finished: false,
                    output: `Unable to read file ${args.path}: file not exists.`,
                };
            }

            if (content === '') {
                return {
                    type: 'success',
                    finished: false,
                    output: `File ${args.path} is an empty file.`,
                };
            }

            if (content.length > 30000) {
                return {
                    type: 'success',
                    finished: false,
                    output: `Unable to read file ${args.path}: This file is too large.`,
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
