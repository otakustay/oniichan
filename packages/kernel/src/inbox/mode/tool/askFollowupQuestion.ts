import type {AskFollowupQuestionParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

export class AskFollowupQuestionToolImplement extends ToolProviderBase<AskFollowupQuestionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: true,
            executionData: {},
            template: '',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<AskFollowupQuestionParameter> {
        return {
            question: asString(generated.question),
        };
    }

    parseParameters(extracted: Partial<AskFollowupQuestionParameter>): AskFollowupQuestionParameter {
        return {
            question: extracted.question ?? '',
        };
    }
}
