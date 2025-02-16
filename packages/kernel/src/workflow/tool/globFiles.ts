import path from 'node:path';
import {findFilesByGlobParameters, FindFilesByGlobParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase, ToolRunResult} from './utils';

export class GlobFilesToolImplement extends ToolImplementBase<FindFilesByGlobParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, findFilesByGlobParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            glob: args.glob,
        };
    }

    protected async execute(args: FindFilesByGlobParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now',
                };
            }

            const files = await workspace.findFiles(args.glob, 200);

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
