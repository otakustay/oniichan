import {runCommandParameters, RunCommandParameter} from '@oniichan/shared/tool';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {resultMarkdown, ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';

const DEFAULT_COMMAND_TIMEOUT = 5 * 60 * 1000;

function findCommandNames(script: string): string[] {
    // This is a very simple implement, using `bash-parser` introduce too many complexity
    return script
        .split('&&')
        .flatMap(v => v.split('||'))
        .map(v => v.split(/\s/).at(0))
        .map(v => v?.trim())
        .filter(v => typeof v === 'string');
}

export class RunCommandToolImplement extends ToolImplementBase<RunCommandParameter> {
    constructor(init: ToolImplementInit) {
        super('RunCommandToolImplement', init, runCommandParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            command: args.command,
        };
    }

    protected async execute(): Promise<ToolRunStep> {
        const args = this.getToolCallArguments();
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    output: 'No open workspace, you cannot execute a command since we don\t have a working directory',
                };
            }

            const result = await this.editorHost.call(
                'executeTerminal',
                {command: args.command, cwd: root, timeout: DEFAULT_COMMAND_TIMEOUT}
            );

            switch (result.status) {
                case 'exit':
                    this.logger.trace('RunCommandExit');
                    return {
                        type: 'success',
                        finished: false,
                        output: result.output
                            ? resultMarkdown(`Command executed, here is its output:`, result.output, 'shell')
                            : `Command exited without any output`,
                    };
                case 'timeout':
                    this.logger.trace('RunCommandTimeout');
                    return {
                        type: 'success',
                        finished: false,
                        output: result.output
                            ? 'This command is still running, it can be a long running session such as a dev server, unfortunately we can\'t retrieve any command output at this time, please continue your work'
                            : resultMarkdown(
                                'This command is still running, here is its output so far:',
                                result.output,
                                'shell'
                            ),
                    };
                case 'noShellIntegration':
                    this.logger.trace('RunCommandNoShellIntegration');
                    return {
                        type: 'success',
                        finished: false,
                        output:
                            'We have already start this command in terminal, unfortunately we are not able to determine whether its finished, and we cannot retrieve any command output at this time, please continue your work',
                    };
                case 'longRunning':
                    this.logger.trace('RunCommandLongRunning');
                    return {
                        type: 'success',
                        finished: false,
                        // It's quite impossible that a long running command has no output
                        output: resultMarkdown(
                            'This command is a long running one such as a dev server, this means it will not exit in forseeable future, here is its output so far:',
                            result.output,
                            'shell'
                        ),
                    };
                default:
                    assertNever<string>(result.status, v => `Unknown terminal run status ${v}`);
            }
        }
        catch (ex) {
            this.logger.error('RunCommandError', {command: args.command, reason: stringifyError(ex)});
            return {
                type: 'executeError',
                output: `Unable to execute command \`${args.command}\`: ${stringifyError(ex)}`,
            };
        }
    }

    protected requireUserApprove(): boolean {
        const args = this.getToolCallArguments();
        const commands = findCommandNames(args.command);

        const hasExceptionCommand = commands.some(v => this.inboxConfig.exceptionCommandList.includes(v));
        return this.inboxConfig.automaticRunCommand ? hasExceptionCommand : !hasExceptionCommand;
    }

    protected async userReject(): Promise<ToolRunStep> {
        return {
            type: 'success',
            finished: false,
            output: 'User has rejected to run this command, you should continue without this command being executed',
        };
    }
}
