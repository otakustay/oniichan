import dedent from 'dedent';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import type {SemanticEditCodeParameter, ToolDescription} from '@oniichan/shared/tool';
import {ToolProviderBase, asString} from '../tool/index.js';
import type {ToolExecuteResult} from '../tool/index.js';

export const semanticEditCode: ToolDescription = {
    name: 'semantic_edit_code',
    description: 'Involve a skilled coder to implement a coding requirement described in natural language.',
    parameters: {
        type: 'object',
        properties: {
            requirement: {
                type: 'string',
                description:
                    'Coding requirement represented in natural language, all coding tasks should go through this tool, including file creationg, modification and deletion.',
            },
        },
        required: ['requirement'],
    },
    usage: dedent`
        <semantic_edit_code>
            <requirements>Add argument bar to all calls to function foo</requirements>
        </semantic_edit_code>
    `,
};

export class SemanticEditCodeToolImplement extends ToolProviderBase<SemanticEditCodeParameter> {
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
