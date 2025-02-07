import {Terminal, Disposable, window} from 'vscode';
import {wait, waitCondition} from '@oniichan/shared/promise';

function extractExecutionOutput(content: string) {
    return /\]633;C([\s\S]*?)\]633;D/.exec(content)?.at(1) ?? '';
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

export async function readTerminalExecution(stream: AsyncIterable<string>): Promise<string> {
    const {default: stripAnsi} = await import('strip-ansi');
    const chunks: string[] = [];

    // TODO: Can we get partial output before it exits?
    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    const rawContent = chunks.join('');
    const commandOutput = extractExecutionOutput(rawContent);
    const cleanedContent = removeInvisibleCharacters(stripAnsi(commandOutput));
    const lines = cleanedContent.split('\n');
    if (lines.length > 0) {
        lines[0] = removeDuplicatedHeadingCharacter(lines[0]);
        lines[0] = removeHeadingSymbols(lines[0]);
    }
    if (lines.length > 1) {
        lines[1] = removeHeadingSymbols(lines[1]);
    }
    return lines.join('\n');
}

export type ExecuteStatus = 'exit' | 'timeout' | 'noShellIntegration';

export interface ExecuteResult {
    status: ExecuteStatus;
    exitCode: number | null;
    output: string;
}

export class ExecutionTerminal implements Disposable {
    static async create() {
        const teriminal = window.createTerminal('Oniichan');
        await waitCondition(() => !!teriminal.shellIntegration, {interval: 50, timeout: 3000});
        return new ExecutionTerminal(teriminal);
    }

    private readonly terminal: Terminal;

    private status: 'running' | 'idle' = 'idle';

    constructor(terminal: Terminal) {
        this.terminal = terminal;
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
            throw new Error('Terminal is running another command');
        }

        this.status = 'running';
        this.terminal.show();

        return Promise.race([this.executeCommand(command), this.reportTimeout(timeout)]);
    }

    dispose() {
        this.terminal.dispose();
    }

    private async reportTimeout(timeout: number): Promise<ExecuteResult> {
        await wait(timeout);
        return {
            status: 'timeout',
            exitCode: null,
            output: '',
        };
    }

    private async executeCommand(command: string): Promise<ExecuteResult> {
        if (this.terminal.shellIntegration) {
            const execution = this.terminal.shellIntegration.executeCommand(command);
            const output = await readTerminalExecution(execution.read());
            this.status = 'idle';
            return {
                status: 'exit',
                exitCode: this.terminal.exitStatus?.code ?? null,
                output,
            };
        }

        // For non-shell-integrated terminals, it goes into an always-running state
        this.terminal.sendText(command);
        return {
            status: 'noShellIntegration',
            exitCode: null,
            output: '',
        };
    }
}

export class TerminalManager implements Disposable {
    private readonly terminals: ExecutionTerminal[] = [];

    private readonly didCloseTerminal: Disposable;

    constructor() {
        this.didCloseTerminal = window.onDidCloseTerminal(terminal => this.removeTerminal(terminal));
    }

    async getTerminal(cwd: string) {
        const available = this.terminals.find(terminal => terminal.isIdle() && terminal.cwd() === cwd);

        if (available) {
            return available;
        }

        const terminal = await ExecutionTerminal.create();
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
