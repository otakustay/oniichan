import type {ToolDescription} from '@oniichan/shared/tool';
import dedent from 'dedent';

export const createPlan: ToolDescription = {
    name: 'create_plan',
    description: 'Create a plan containing one or more tasks, tasks will be picked and executed afterwards.',
    parameters: {
        type: 'object',
        properties: {
            read: {
                type: 'array',
                description:
                    'One or more tasks related to plan envolving gathering information from project, including reading files, directories and searching for specific patterns',
                items: {
                    type: 'string',
                },
            },
            coding: {
                type: 'array',
                description:
                    'One or more tasks related to plan envolving editing project, including creating, modifying, deleteing files and running terminal commands',
                items: {
                    type: 'string',
                },
            },
        },
        required: [],
    },
    usage: dedent`
        <create_plan>
        <read>Search for usage of debounce function</read>
        <read>Read package.json to see if lodash is installed</read>
        <coding>Delete file debounce.ts</coding>
        <coding>Remove import of debounce from index.ts</coding>
        <coding>Uninstall lodash</coding>
        </create_plan>
    `,
};

export const completeTask: ToolDescription = {
    name: 'complete_task',
    description:
        'When you confirm the task given is completed, use this tool to finish your work, provide a confidence value. This tool is a hidden tool, user will not get any insight when this tool get executed, so do not leak the tool name or its paramters outside the tool call XML tag.',
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
