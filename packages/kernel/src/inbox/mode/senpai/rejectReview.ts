import type {AskFollowupQuestionParameter, ToolDescription} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase, asString, askFollowupQuestion} from '../tool';
import type {ToolExecuteResult} from '../tool';

export const rejectReview: ToolDescription = {
    ...askFollowupQuestion,
    description:
        'Use this tool to instruct that previous task completion is not satisfactory, put an instruction on what is incomplete or broken in `question` parameter',
};

export class RejectReviewToolImplement extends ToolProviderBase<AskFollowupQuestionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: false,
            executionData: {},
            template:
                'It seems we still have some issues in completing this task, you should start to examine the instructions in last <ask_follow_question> tool and continue to solve all issues',
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
