import path from 'node:path';
import dedent from 'dedent';
import type {FindFilesByGlobParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

export class GlobFilesToolImplement extends ToolProviderBase<FindFilesByGlobParameter> {
    async executeApprove(args: FindFilesByGlobParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    executionData: {},
                    template: 'No open workspace, you cannot read any file or directory now.',
                };
            }

            const files = await this.editorHost.call('findFiles', {glob: args.glob, limit: 200});

            if (files.length) {
                return {
                    type: 'success',
                    finished: false,
                    executionData: {glob: args.glob, content: files.map(v => path.relative(root, v)).join('\n')},
                    template: dedent`
                        Files matching glob {{glob}}:

                        \`\`\`
                        {{content}}
                        \`\`\`
                    `,
                };
            }

            return {
                type: 'success',
                finished: false,
                executionData: {glob: args.glob},
                template: 'There are no files matching glob `{{glob}}`.',
            };
        }
        catch (ex) {
            return {
                type: 'error',
                finished: false,
                executionData: {glob: args.glob, message: stringifyError(ex)},
                template: 'Unable to find files with pattern {{glob}}: {{message}}.',
            };
        }
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<FindFilesByGlobParameter> {
        return {
            glob: asString(generated.glob, true),
        };
    }

    parseParameters(extracted: Partial<FindFilesByGlobParameter>): FindFilesByGlobParameter {
        return {
            glob: extracted.glob ?? '',
        };
    }
}
