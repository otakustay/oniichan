import dedent from 'dedent';
import type {CreatePlanParameter, PlanTask, ToolDescription} from '@oniichan/shared/tool';
import {ToolProviderBase} from '../tool/index.js';
import type {ToolExecuteResult} from '../tool/index.js';

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

interface Extracted {
    read: string[];
    coding: string[];
}

interface ParseResult {
    readTasks: string[];
    codingTasks: string[];
    tasks: PlanTask[];
}

export class CreatePlanToolImplement extends ToolProviderBase<CreatePlanParameter, Extracted> {
    async executeApprove(args: CreatePlanParameter): Promise<ToolExecuteResult> {
        const firstTask = args.tasks.at(0);

        if (!firstTask) {
            throw new Error('There is no task in plan');
        }

        firstTask.status = 'executing';
        return {
            type: 'success',
            finished: false,
            executionData: {task: firstTask.text},
            template: dedent`
                You are in the state of completing one single task in the plan.

                The execution of the plan is a very serious process, you should carefully pick tasks from the plan, finish each task step by step.

                Any action outside the scope of this plan is strictly prohibited, if the plan does not explicitly include any task to write code, you are now allowed to do any creation, modification or deleteion of files.

                This is the task you are currently asked to handle:

                {{task}}
            `,
        };
    }

    extractParameters(): Extracted {
        const parsed = this.parseSource();

        return {
            read: parsed.readTasks,
            coding: parsed.codingTasks,
        };
    }

    parseParameters(): CreatePlanParameter {
        const parsed = this.parseSource();
        return {
            tasks: parsed.tasks,
        };
    }

    private getChunkSource(): string {
        const message = this.roundtrip.getLatestWorkflow()?.getOriginMessage() ?? this.roundtrip.getLatestTextMessage();

        if (message) {
            return message.findToolCallChunkStrict().source;
        }

        throw new Error('No plan tool message found');
    }

    private parseSource(): ParseResult {
        // `<read>` and `<coding>` tags can be interleaved in order,
        // to keep their original order, we have to parse from source text
        const source = this.getChunkSource();
        const result: ParseResult = {
            readTasks: [],
            codingTasks: [],
            tasks: [],
        };

        for (const match of source.matchAll(/<{1,2}(read|coding)>(.*)<\/(read|coding)>/g)) {
            const type = match.at(1);
            const text = match.at(2);

            if (!type || !text) {
                continue;
            }

            if (type === 'read') {
                result.readTasks.push(text);
                result.tasks.push({taskType: 'read', status: 'pending', text});
            }
            else {
                result.codingTasks.push(text);
                result.tasks.push({taskType: 'coding', status: 'pending', text});
            }
        }

        return result;
    }
}
