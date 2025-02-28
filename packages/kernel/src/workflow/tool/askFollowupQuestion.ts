import {AskFollowupQuestionParameter, askFollowupQuestionParameters} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';

export class AskFollowupQuestionToolImplement extends ToolImplementBase<AskFollowupQuestionParameter> {
    constructor(init: ToolImplementInit) {
        super('DeleteFileToolImplement', init, askFollowupQuestionParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            question: args.question,
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
