import {findFilesByRegExpParameters, FindFilesByRegExpParameter} from '@oniichan/shared/tool';
import {joinToMaxLength} from '@oniichan/shared/string';
import {Logger} from '@oniichan/shared/logger';
import {stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase, ToolRunResult} from './utils';

interface GrepState {
    currentGroupLines: string[];
    isCurrentGroupAvailable: boolean;
    isFiltered: boolean;
}

function groupGrepOutput(output: string) {
    const lines = output.split('\n');
    const groups: string[] = [];
    const state: GrepState = {
        currentGroupLines: [],
        isCurrentGroupAvailable: true,
        isFiltered: false,
    };
    for (const line of lines) {
        if (line === '--') {
            if (state.isCurrentGroupAvailable) {
                groups.push(state.currentGroupLines.join('\n'));
                state.currentGroupLines = [];
                state.isCurrentGroupAvailable = true;
            }
            continue;
        }

        if (line.length > 500) {
            state.isCurrentGroupAvailable = false;
            state.isFiltered = true;
        }

        if (state.isCurrentGroupAvailable) {
            state.currentGroupLines.push(line);
        }
    }

    const joined = joinToMaxLength(groups, '\n--\n', 4000);
    return {
        content: joined.value,
        isTruncated: state.isFiltered || joined.includedItems < groups.length,
        originalCount: groups.length,
        truncatedCount: joined.includedItems,
    };
}

export class GrepFilesToolImplement extends ToolImplementBase<FindFilesByRegExpParameter> {
    private readonly logger: Logger;

    constructor(editorHost: EditorHost, logger: Logger) {
        super(editorHost, findFilesByRegExpParameters);
        this.logger = logger.with({source: 'GrepFilesToolImplement'});
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
            const commandLineArgs = [
                '-i',
                '-E',
                args.regex,
                '--context=1',
                '--exclude-dir',
                '.git,.nx,.husky,node_modules,.webpack,dist',
                '-r',
                args.path,
            ];
            this.logger.trace('ExecuteGrepStart', {args: commandLineArgs});
            const grep = await execa('grep', commandLineArgs, {cwd: root});

            if (grep.stdout) {
                const output = groupGrepOutput(grep.stdout);

                if (output.isTruncated) {
                    this.logger.trace(
                        'ExecuteGrepFinish',
                        {
                            original: output.originalCount,
                            truncated: output.truncatedCount,
                        }
                    );
                }

                const title = output.isTruncated
                    ? 'We have too many results for grep, this is some of them, you may use a more accurate search pattern if this output does not satisfy your needs:'
                    : 'This is stdout of grep command:';
                return {
                    type: 'success',
                    finished: false,
                    output: resultMarkdown(title, output.content),
                };
            }

            this.logger.trace('ExecuteGrepFinish', {original: 0, truncated: 0});
            return {
                type: 'success',
                finished: false,
                output: 'There are no files matching this regex',
            };
        }
        catch (ex) {
            this.logger.error('ExecuteGrepFail', {reason: stringifyError(ex)});

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
