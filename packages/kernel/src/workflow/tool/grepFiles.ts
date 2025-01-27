import url from 'node:url';
import {findFilesByRegExpParameters, FindFilesByRegExpParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase} from './utils';

export class GrepFilesToolImplement extends ToolImplementBase<FindFilesByRegExpParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, findFilesByRegExpParameters);
    }

    protected parseArgs(args: Record<string, string>): FindFilesByRegExpParameter {
        return {
            regex: args.regex,
            path: args.path,
        };
    }

    protected async execute(args: FindFilesByRegExpParameter): Promise<string> {
        const workspace = this.editorHost.getWorkspace();
        const {execa, ExecaError} = await import('execa');
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return 'No open workspace, you cannot read any file or directory now';
            }

            // TODO: Use `ripgrep`, this is now macOS style `grep`
            const grep = await execa(
                'grep',
                [
                    '-i',
                    '-E',
                    args.regex,
                    '--context=1',
                    '--exclude-dir',
                    '.git,.nx,.husky,node_modules',
                    '-r',
                    args.path,
                ],
                {cwd: url.fileURLToPath(root)}
            );

            return resultMarkdown(
                `This is stdout of grep command:`,
                grep.stdout
            );
        }
        catch (ex) {
            if (ex instanceof ExecaError) {
                if (ex.exitCode === 1) {
                    return 'There is not files matching this regex.';
                }
                if (ex.stderr) {
                    return resultMarkdown(
                        `Execute grep failed, here is stderr:`,
                        ex.stderr
                    );
                }
            }
            return `Unsable to find files with regex \`${args.regex}\`: ${stringifyError(ex)}`;
        }
    }
}
