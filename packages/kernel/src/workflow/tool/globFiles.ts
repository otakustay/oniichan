import path from 'node:path';
import {findFilesByGlobParameters, FindFilesByGlobParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

export class GlobFilesToolImplement extends ToolImplementBase<FindFilesByGlobParameter> {
    constructor(init: ToolImplementInit) {
        super('GlobFilesToolImplement', init, findFilesByGlobParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            glob: args.glob,
        };
    }

    protected async execute(args: FindFilesByGlobParameter): Promise<ToolRunResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now',
                };
            }

            // TODO: glob `src/**/chunk.{ts,tsx}` gets "relative-absolute" paths
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
                output: `There are no files matching glob \`${args.glob}\``,
            };
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unable to find files with pattern ${args.glob}: ${stringifyError(ex)}`,
            };
        }
    }
}
