import path from 'node:path';
import {existsSync} from 'node:fs';
import {over} from '@otakustay/async-iterator';
import {toLines} from '@oniichan/shared/iterable';

interface ExecuteCommandOptions {
    cwd: string;
    includeErrorOutput: boolean;
    maxLines?: number;
}

export class CommandExecutor {
    static readonly containerKey: 'CommandExecutor';

    private readonly binaryDirectory: string;

    constructor(binaryDirectory: string) {
        this.binaryDirectory = binaryDirectory;
    }

    has(command: string): boolean {
        return existsSync(path.join(this.binaryDirectory, command));
    }

    async *executeStream(command: string, args: string[], options: ExecuteCommandOptions): AsyncIterable<string> {
        const {execa} = await import('execa');
        const process = execa(
            path.join(this.binaryDirectory, command),
            args,
            {
                cwd: options.cwd,
                all: options.includeErrorOutput,
            }
        );
        process.catch(() => {});
        const stream = options.includeErrorOutput ? process.all : process.stdout;

        if (!stream) {
            throw new Error(`Failed to read output stream from command ${command}`);
        }

        const state = {
            remainingLines: options.maxLines ?? Number.MAX_SAFE_INTEGER,
        };
        const stringStream = over(stream).map((v: string | Buffer) => v.toString());
        const lineStream = toLines(stringStream);
        for await (const line of lineStream) {
            yield line;
            state.remainingLines--;

            if (state.remainingLines <= 0) {
                process.kill();
                break;
            }
        }
    }
}
