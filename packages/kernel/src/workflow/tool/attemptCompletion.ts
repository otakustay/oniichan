import {AttemptCompletionParameter, attemptCompletionParameters} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';

export class AttemptCompletionToolImplement extends ToolImplementBase<AttemptCompletionParameter> {
    constructor(init: ToolImplementInit) {
        super('DeleteFileToolImplement', init, attemptCompletionParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            result: args.result,
        };
    }

    protected async execute(): Promise<ToolRunStep> {
        return {
            type: 'success',
            finished: true,
            output: '',
        };
    }
}
