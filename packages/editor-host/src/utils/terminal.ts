import {Terminal, Disposable, window} from 'vscode';
import {wait, waitCondition} from '@oniichan/shared/promise';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';

function extractExecutionOutput(content: string) {
    const fullOutputContent = /\]633;C([\s\S]*?)\]633;D/.exec(content)?.at(1);

    if (typeof fullOutputContent === 'string') {
        return fullOutputContent;
    }

    const matchStart = /\]633;C/.exec(content);

    if (matchStart) {
        return content.slice(matchStart.index + matchStart[0].length);
    }

    return content;
}

function removeInvisibleCharacters(content: string) {
    return content.replaceAll(/[^\x20-\x7E]/g, '');
}

function removeDuplicatedHeadingCharacter(content: string) {
    if (content.at(0) === content.at(1)) {
        return content.slice(1);
    }

    return content;
}

function removeHeadingSymbols(content: string) {
    return content.replace(/^[^a-zA-Z0-9]*/, '');
}

function removeUnwantedTailingContent(line: string) {
    return line.replace(/[%$#>]\s*$/, '');
}

export type ExecuteStatus = 'exit' | 'timeout' | 'noShellIntegration';

export interface ExecuteResult {
    status: ExecuteStatus;
    output: string;
}

export class ExecutionTerminal implements Disposable {
    static async create(logger: Logger) {
        const teriminal = window.createTerminal('Oniichan');
        await waitCondition(() => !!teriminal.shellIntegration, {interval: 50, timeout: 3000});
        return new ExecutionTerminal(teriminal, logger);
    }

    private readonly terminal: Terminal;

    private readonly output: string[] = [];

    private readonly logger: Logger;

    private status: 'running' | 'idle' = 'idle';

    constructor(terminal: Terminal, logger: Logger) {
        this.terminal = terminal;
        this.logger = logger.with({source: 'ExecutionTerminal'});
    }

    hasShellIntegration() {
        return !!this.terminal.shellIntegration;
    }

    is(terminal: Terminal) {
        return this.terminal === terminal;
    }

    isIdle() {
        return this.status === 'idle';
    }

    cwd(): string | null {
        const cwd = this.terminal.shellIntegration?.cwd;
        return cwd ? cwd.fsPath : null;
    }

    execute(command: string, timeout: number): Promise<ExecuteResult> {
        if (this.status === 'running') {
            this.logger.warn('TerminalConcurrentUse');
            throw new Error('Terminal is running another command');
        }

        this.logger.trace('TerminalExecute', {command, timeout});
        this.status = 'running';
        this.output.length = 0;
        this.terminal.show();

        return Promise.race([this.executeCommand(command), this.reportTimeout(timeout)]);
    }

    dispose() {
        this.terminal.dispose();
    }

    private async reportTimeout(timeout: number): Promise<ExecuteResult> {
        await wait(timeout);
        const output = await this.parseCommandOutput();
        return {
            status: 'timeout',
            output,
        };
    }

    private async waitTerminalExecution(stream: AsyncIterable<string>) {
        for await (const chunk of stream) {
            this.output.push(chunk);
        }
    }

    private async parseCommandOutput() {
        const {default: stripAnsi} = await import('strip-ansi');
        const rawContent = this.output.join('');
        const commandOutput = extractExecutionOutput(rawContent);
        const cleanedContent = stripAnsi(commandOutput);
        const lines = cleanedContent.split('\n');
        if (lines.length > 0) {
            lines[0] = removeInvisibleCharacters(lines[0]);
            lines[0] = removeDuplicatedHeadingCharacter(lines[0]);
            lines[0] = removeHeadingSymbols(lines[0]);
            lines[lines.length - 1] = removeUnwantedTailingContent(lines[lines.length - 1]);
        }
        if (lines.length > 1) {
            lines[1] = removeHeadingSymbols(lines[1]);
        }
        return lines.join('\n').trim();
    }

    private async executeCommand(command: string): Promise<ExecuteResult> {
        if (this.terminal.shellIntegration) {
            const execution = this.terminal.shellIntegration.executeCommand(command);
            await this.waitTerminalExecution(execution.read());
            const output = await this.parseCommandOutput();
            this.status = 'idle';
            return {
                status: 'exit',
                output,
            };
        }

        // For non-shell-integrated terminals, it goes into an always-running state
        this.terminal.sendText(command);
        return {
            status: 'noShellIntegration',
            output: '',
        };
    }
}

interface Dependency {
    [Logger.containerKey]: Logger;
}

export class TerminalManager implements Disposable {
    private readonly terminals: ExecutionTerminal[] = [];

    private readonly didCloseTerminal: Disposable;

    private readonly logger: Logger;

    constructor(container: DependencyContainer<Dependency>) {
        this.didCloseTerminal = window.onDidCloseTerminal(terminal => this.removeTerminal(terminal));
        this.logger = container.get(Logger).with({source: 'TerminalManager'});
    }

    async getTerminal(cwd: string) {
        const available = this.terminals.find(terminal => terminal.isIdle() && terminal.cwd() === cwd);

        if (available) {
            this.logger.trace('ReuseTerminal');
            return available;
        }

        this.logger.trace('CreateTerminal');
        const terminal = await ExecutionTerminal.create(this.logger);
        this.terminals.push(terminal);
        return terminal;
    }

    dispose() {
        this.didCloseTerminal.dispose();

        for (const terminal of this.terminals) {
            terminal.dispose();
        }
    }

    private removeTerminal(terminal: Terminal) {
        const index = this.terminals.findIndex(v => v.is(terminal));
        if (index !== -1) {
            this.terminals.splice(index, 1);
        }
    }
}
