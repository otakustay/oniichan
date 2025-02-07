import {runCommandParameters, RunCommandParameter} from '@oniichan/shared/tool';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {resultMarkdown, ToolImplementBase, ToolRunResult} from './utils';

export class RunCommandToolImplement extends ToolImplementBase<RunCommandParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, runCommandParameters);
    }

    protected parseArgs(args: Record<string, string>): RunCommandParameter {
        return {
            command: args.command,
        };
    }

    protected async execute(args: RunCommandParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();

        try {
            const root = await workspace.getRoot();

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot execute a command since we don\t have a working directory',
                };
            }

            const terminal = this.editorHost.getTerminal();
            const result = await terminal.runCommand({command: args.command, cwd: root});

            switch (result.status) {
                case 'exit':
                    return {
                        type: 'success',
                        finished: false,
                        output: result.output
                            ? resultMarkdown(
                                `Command executed, here is its output:`,
                                result.output
                            )
                            : `Command exited without any output`,
                    };
                case 'timeout':
                    return {
                        type: 'success',
                        finished: false,
                        output: result.output
                            ? 'This command is still running, it can be a long running session such as a dev server, unfortunately we can\'t retrieve any command output at this time, please continue your work'
                            : resultMarkdown(
                                'This command is still running, here is its output so far:',
                                result.output
                            ),
                    };
                case 'noShellIntegration':
                    return {
                        type: 'success',
                        finished: false,
                        output:
                            'We have already start this command in terminal, unfortunately we are not able to determine whether its finished, and we cannot retrieve any command output at this time, please continue your work',
                    };
                default:
                    assertNever<string>(result.status, v => `Unknown terminal run status ${v}`);
            }
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: `Unable to execute command \`${args.command}\`: ${stringifyError(ex)}`,
            };
        }
    }
}
