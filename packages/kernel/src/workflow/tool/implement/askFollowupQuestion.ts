import type {AskFollowupQuestionParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class AskFollowupQuestionToolImplement extends ToolImplementBase<AskFollowupQuestionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: true,
            output: '',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<AskFollowupQuestionParameter> {
        return {
            question: asString(generated.question),
        };
    }
}
