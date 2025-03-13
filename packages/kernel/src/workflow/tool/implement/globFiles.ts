import path from 'node:path';
import type {FindFilesByGlobParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {resultMarkdown} from '../utils';

export class GlobFilesToolImplement extends ToolImplementBase<FindFilesByGlobParameter> {
    async executeApprove(args: FindFilesByGlobParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now.',
                };
            }

            const files = await this.editorHost.call('findFiles', {glob: args.glob, limit: 200});

            if (files.length) {
                return {
                    type: 'success',
                    finished: false,
                    output: resultMarkdown(
                        `Files matching glob ${args.glob}:`,
                        files.map(v => path.relative(root, v)).join('\n')
                    ),
                };
            }

            return {
                type: 'success',
                finished: false,
                output: `There are no files matching glob \`${args.glob}\`.`,
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unable to find files with pattern ${args.glob}: ${stringifyError(ex)}.`,
            };
        }
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<FindFilesByGlobParameter> {
        return {
            glob: generated.glob?.trim(),
        };
    }
}
