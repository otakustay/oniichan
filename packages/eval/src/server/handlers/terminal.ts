import childProcess from 'node:child_process';
import type {ChildProcess} from 'node:child_process';
import type {ExecuteStatus, ExecuteTerminalRequest, ExecuteTerminalResponse} from '@oniichan/editor-host/protocol';
import {RequestHandler} from './handler';

export class ExecuteTerminalHandler extends RequestHandler<ExecuteTerminalRequest, ExecuteTerminalResponse> {
    static readonly action = 'executeTerminal';

    private process: ChildProcess | null = null;

    private timeoutTick: NodeJS.Timeout | null = null;

    private output: string[] = [];

    async *handleRequest(payload: ExecuteTerminalRequest): AsyncIterable<ExecuteTerminalResponse> {
        const {cwd} = this.context;

        const tasks = [this.executeCommand(payload.command, payload.cwd ?? cwd), this.reportTimeout(payload.timeout)];
        try {
            const status = await Promise.race(tasks);
            yield {
                status,
                output: this.output.join(''),
            };
        }
        finally {
            this.cleanup();
        }
    }

    private async executeCommand(command: string, cwd: string): Promise<ExecuteStatus> {
        const executor = (resolve: (status: ExecuteStatus) => void) => {
            try {
                this.process = childProcess.spawn(
                    command,
                    {cwd, shell: true}
                );

                this.process.stdout?.on('data', (v: string | Buffer) => this.output.push(v.toString()));
                this.process.stderr?.on('data', (v: string | Buffer) => this.output.push(v.toString()));
                const exit = () => {
                    resolve('exit');
                };
                this.process.on('close', exit);
                this.process.on('exit', exit);
                this.process.on('error', exit);
            }
            catch {
                resolve('exit');
            }
        };
        return new Promise(executor);
    }

    private async reportTimeout(ms: number): Promise<ExecuteStatus> {
        await new Promise(r => this.timeoutTick = setTimeout(r, ms));
        return 'timeout';
    }

    private cleanup() {
        if (this.timeoutTick) {
            clearTimeout(this.timeoutTick);
            this.timeoutTick = null;
        }

        if (this.process) {
            try {
                this.process.kill();
            }
            finally {
                this.process = null;
            }
        }
    }
}
