import path from 'node:path';
import {findFilesByGlobParameters, FindFilesByGlobParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase} from './utils';

export class GlobFilesToolImplement extends ToolImplementBase<FindFilesByGlobParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, findFilesByGlobParameters);
    }

    protected parseArgs(args: Record<string, string>): FindFilesByGlobParameter {
        return {
            glob: args.glob,
        };
    }

    protected async execute(args: FindFilesByGlobParameter): Promise<string> {
        const workspace = this.editorHost.getWorkspace();
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return 'No open workspace, you cannot read any file or directory now';
            }

            const files = await workspace.findFiles(args.glob, 200);
            return resultMarkdown(
                `Files matching glob ${args.glob}:`,
                files.map(v => path.relative(root, v)).join('\n')
            );
        }
        catch (ex) {
            return `Unsable to find files with pattern ${args.glob}: ${stringifyError(ex)}`;
        }
    }
}
