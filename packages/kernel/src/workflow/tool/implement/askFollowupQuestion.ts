import {AskFollowupQuestionParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolExecuteResult} from './base';

export class AskFollowupQuestionToolImplement extends ToolImplementBase<AskFollowupQuestionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: true,
            output: '',
        };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<AskFollowupQuestionParameter> {
        return {
            question: generated.question?.trim(),
        };
    }
}
