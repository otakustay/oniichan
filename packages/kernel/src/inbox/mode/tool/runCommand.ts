import dedent from 'dedent';
import type {RunCommandParameter} from '@oniichan/shared/tool';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

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

export class RunCommandToolImplement extends ToolProviderBase<RunCommandParameter> {
    async executeApprove(args: RunCommandParameter): Promise<ToolExecuteResult> {
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');

            if (!root) {
                return {
                    type: 'success',
                    finished: false,
                    executionData: {},
                    template:
                        'No open workspace, you cannot execute a command since we don\'t have a working directory.',
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
                        executionData: {output: result.output},
                        template: result.output
                            ? dedent`
                                Command executed, here is its output:

                                \`\`\`shell
                                {{output}}
                                \`\`\`
                            `
                            : 'Command exited without any output',
                    };
                case 'timeout':
                    this.logger.trace('RunCommandTimeout');
                    return {
                        type: 'success',
                        finished: false,
                        executionData: {output: result.output},
                        template: result.output
                            ? dedent`
                                This command is still running, here is its output so far:

                                \`\`\`shell
                                {{output}}
                                \`\`\`
                            `
                            : 'This command is still running, it can be a long running session such as a dev server, unfortunately we can\'t retrieve any command output at this time, please continue your work.',
                    };
                case 'noShellIntegration':
                    this.logger.trace('RunCommandNoShellIntegration');
                    return {
                        type: 'success',
                        finished: false,
                        executionData: {},
                        template:
                            'We have already start this command in terminal, unfortunately we are not able to determine whether its finished, and we cannot retrieve any command output at this time, please continue your work.',
                    };
                case 'longRunning':
                    this.logger.trace('RunCommandLongRunning');
                    return {
                        type: 'success',
                        finished: false,
                        executionData: {output: result.output},
                        // It's quite impossible that a long running command has no output
                        template: dedent`
                            This command is a long running one such as a dev server, this means it will not exit in forseeable future, here is its output so far:

                            \`\`\`shell
                            {{output}}
                            \`\`\`
                        `,
                    };
                default:
                    assertNever<string>(result.status, v => `Unknown terminal run status ${v}`);
            }
        }
        catch (ex) {
            this.logger.error('RunCommandError', {command: args.command, reason: stringifyError(ex)});
            return {
                type: 'error',
                finished: false,
                executionData: {command: args.command, message: stringifyError(ex)},
                template: 'Unable to execute command `{{command}}`: {{message}}.',
            };
        }
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<RunCommandParameter> {
        return {
            command: asString(generated.command, true),
        };
    }

    parseParameters(extracted: Partial<RunCommandParameter>): RunCommandParameter {
        return {
            command: extracted.command ?? '',
        };
    }

    requireUserApprove(): boolean {
        const chunk = this.getToolCallChunkStrict('run_command');
        const commands = findCommandNames(chunk.arguments.command);
        const hasExceptionCommand = commands.some(v => this.inboxConfig.exceptionCommandList.includes(v));
        return this.inboxConfig.automaticRunCommand ? hasExceptionCommand : !hasExceptionCommand;
    }

    async executeReject(): Promise<string> {
        return 'User has rejected to run this command, you should continue without this command being executed.';
    }
}
