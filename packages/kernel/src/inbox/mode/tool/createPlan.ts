import dedent from 'dedent';
import type {CreatePlanParameter, PlanTask} from '@oniichan/shared/tool';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';

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
