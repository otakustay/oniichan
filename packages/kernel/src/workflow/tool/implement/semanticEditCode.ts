import dedent from 'dedent';
import type {SemanticEditCodeParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';
import {asString} from './utils';

export class SemanticEditCodeToolImplement extends ToolImplementBase<SemanticEditCodeParameter> {
    async executeApprove(args: SemanticEditCodeParameter): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: false,
            executionData: {requirement: args.requirement},
            template: dedent`
                Now you should act as a professional coder to handle this coding requirement:

                {{requirement}}
            `,
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
