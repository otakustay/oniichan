import type {AskFollowupQuestionParameter} from '@oniichan/shared/tool';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';

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
