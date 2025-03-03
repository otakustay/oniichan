import {AttemptCompletionParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolExecuteResult} from './base';

export class AttemptCompletionToolImplement extends ToolImplementBase<AttemptCompletionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: true,
            output: '',
        };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<AttemptCompletionParameter> {
        return {
            result: generated.result?.trim(),
            command: generated.command?.trim(),
        };
    }
}
