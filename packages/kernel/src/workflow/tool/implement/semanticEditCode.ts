import type {SemanticEditCodeParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class SemanticEditCodeToolImplement extends ToolImplementBase<SemanticEditCodeParameter> {
    async executeApprove(args: SemanticEditCodeParameter): Promise<ToolExecuteResult> {
        const lines = [
            'Now you should act as a professional coder to handle this coding requirement:',
            args.requirement,
        ];
        return {
            type: 'success',
            finished: false,
            output: lines.join('\n\n'),
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<SemanticEditCodeParameter> {
        return {
            requirement: asString(generated.requirement, true),
        };
    }

    parseParameters(extracted: Partial<SemanticEditCodeParameter>): SemanticEditCodeParameter {
        return {
            requirement: extracted.requirement ?? '',
        };
    }
}
