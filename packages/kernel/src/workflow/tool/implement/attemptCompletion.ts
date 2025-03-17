import type {AttemptCompletionParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class AttemptCompletionToolImplement extends ToolImplementBase<AttemptCompletionParameter> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: true,
            output: '',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<AttemptCompletionParameter> {
        return {
            result: asString(generated.result),
            command: asString(generated.command),
        };
    }
}
