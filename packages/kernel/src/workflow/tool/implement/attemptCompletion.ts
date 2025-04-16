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
            executionData: {},
            template: '',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<AttemptCompletionParameter> {
        return {
            result: asString(generated.result, true),
            command: asString(generated.command, true),
        };
    }

    parseParameters(extracted: Partial<AttemptCompletionParameter>): AttemptCompletionParameter {
        return {
            result: extracted.result ?? '',
            command: extracted.command ?? '',
        };
    }
}
