import type {ToolDescription} from '@oniichan/shared/tool';
import dedent from 'dedent';

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
