import type {AttemptCompletionParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

export class AttemptCompletionToolImplement extends ToolProviderBase<AttemptCompletionParameter> {
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
