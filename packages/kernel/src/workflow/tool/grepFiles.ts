import url from 'node:url';
import {findFilesByRegExpParameters, FindFilesByRegExpParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase, ToolRunResult} from './utils';

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

    protected async execute(args: FindFilesByRegExpParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        const {execa, ExecaError} = await import('execa');
        try {
            const root = await workspace.getRoot();

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot read any file or directory now',
                };
            }

            // TODO: Use `ripgrep`, this is now macOS style `grep`
            // TODO: `grep` can output very very long content, we should try to trim it
            const grep = await execa(
                'grep',
                [
                    '-i',
                    '-E',
                    args.regex,
                    '--context=1',
                    '--exclude-dir',
                    '.git,.nx,.husky,node_modules,.webpack,dist',
                    '-r',
                    args.path,
                ],
                {cwd: url.fileURLToPath(root)}
            );

            if (grep.stdout) {
                return {
                    type: 'success',
                    finished: false,
                    output: resultMarkdown(
                        `This is stdout of grep command:`,
                        grep.stdout
                    ),
                };
            }

            return {
                type: 'success',
                finished: false,
                output: 'There are no files matching this regex',
            };
        }
        catch (ex) {
            if (ex instanceof ExecaError) {
                if (ex.exitCode === 1) {
                    return {
                        type: 'success',
                        finished: false,
                        output: 'There is not files matching this regex.',
                    };
                }
                if (ex.stderr) {
                    return {
                        type: 'executeError',
                        output: resultMarkdown(`Execute grep failed, here is stderr:`, ex.stderr),
                    };
                }
            }
            return {
                type: 'executeError',
                output: `Unsable to find files with regex \`${args.regex}\`: ${stringifyError(ex)}`,
            };
        }
    }
}
