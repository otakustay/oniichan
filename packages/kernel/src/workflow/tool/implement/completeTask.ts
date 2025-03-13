import type {CompleteTaskParameter} from '@oniichan/shared/tool';
import type {CompleteTaskToolCallMessageChunk, ParsedToolCallMessageChunk} from '@oniichan/shared/inbox';
import {assertPlanMessage} from '../../../inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';

function assertChunk(chunk: ParsedToolCallMessageChunk): asserts chunk is CompleteTaskToolCallMessageChunk {
    if (chunk.toolName !== 'complete_task') {
        throw new Error('Invalid tool call message chunk');
    }
}

export class CompleteTaskToolImplement extends ToolImplementBase<CompleteTaskParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        const plan = this.roundtrip.toMessages().findLast(v => v.type === 'plan');

        if (!plan) {
            return {
                type: 'success',
                finished: false,
                output: 'All tasks have been completed, continue your work.',
            };
        }

        assertPlanMessage(plan);
        const chunk = this.getToolCallChunkStrict();
        assertChunk(chunk);

        plan.completeExecutingTask();
        chunk.executionData = plan.getProgress();

        const task = plan.pickFirstPendingTask();
        if (task) {
            task.status = 'executing';
        }

        const paragraphs = task
            ? [
                'The last task has been successfully completed, now you should start working on this task:',
                task.text,
            ]
            : [
                'Please review all information provided, now you need to decide if user\'s request is fully satisfied.',
                'If the original request is fully satisfied, use a <conclusion> tag to conclude this task, everything will stop after this.',
                'Otherwise, you should create a new plan in a <plan> tag to continue our workflow, even though there is a previous <plan> tag, you are welcome to output another new <plan> tag to continue fulfilling user\'s request.',
                'Be very serious to check the status of user request\'s fulfillment, make sure every aspect is covered, all required information is provided, all necessary code edits are performed.',
                'You may see some XML tags in previous messages, they are generated by your partener to take some action to completing a task, but you should not respond with those XML tags other than <plan> or <conclusion>.',
                'If some of user\'s request are not satisfied, such as lack of code edits or result validation, use <plan> tag to fire a new plan.',
                'To recall, this is the original user request:',
                this.roundtrip.getRequestText(),
                'Let\'s now start a new plan! You can reject to create the plan only if you believe everything is done.',
            ];
        return {
            type: 'success',
            finished: false,
            output: paragraphs.join('\n\n'),
        };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<CompleteTaskParameter> {
        const confidence = parseInt(generated.confidence ?? '', 10);
        return {
            confidence: isNaN(confidence) ? undefined : confidence,
        };
    }
}
