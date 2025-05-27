import dedent from 'dedent';
import type {CompleteTaskParameter, ToolDescription} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase, asString} from '../tool';
import type {ToolExecuteResult} from '../tool';

export const completeCoderTask: ToolDescription = {
    name: 'complete_task',
    description:
        'When you confirm that all requirements given in the latest <semantic_code_edit> call are completed, use this tool to finish your work with a confidence value. This tool is a hidden tool, user will not get any insight when this tool get executed, so do not leak the tool name or its paramters outside the tool call XML tag.',
    parameters: {
        type: 'object',
        properties: {
            confidence: {
                type: 'number',
                description:
                    'The confidence value as you regard yourself completely fulfilled this task, an integer from 0 to 100, larger number means more confident',
            },
        },
        required: ['confidence'],
    },
    usage: dedent`
        <complete_task>
            <confidence>87</confidence>
        </complete_task>
    `,
};

interface Extracted {
    confidence: number | undefined;
}

export class CompleteCoderTaskToolImplement extends ToolProviderBase<CompleteTaskParameter, Extracted> {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: false,
            executionData: {},
            template: dedent`
                Now you should examine the changes made in assigned task, and determine if the user's request is fully satisfied.

                If the original request is not fully completed, you should continue working on it, otherwise you can finish by using the "attempt_completion" tool.
            `,
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Extracted {
        const confidence = parseInt(asString(generated.confidence) ?? '', 10);
        return {
            confidence: isNaN(confidence) ? undefined : confidence,
        };
    }

    parseParameters(extracted: Extracted): CompleteTaskParameter {
        return {
            confidence: extracted.confidence ?? 0,
        };
    }
}
