import {writeFileParameters, WriteFileParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

export class WriteFileToolImplement extends ToolImplementBase<WriteFileParameter> {
    constructor(init: ToolImplementInit) {
        super('WriteFileToolImplement', init, writeFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
            content: args.content,
        };
    }

    protected async execute(args: WriteFileParameter): Promise<ToolRunResult> {
        // TODO: We are not writing to file directly, only back to LLM pretending the write is successful
        return {
            type: 'success',
            finished: false,
            output:
                `File is written to ${args.path}, you can trust the file content, it's not neccessary to read this file again`,
        };
    }
}
