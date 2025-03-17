import type {CreatePlanParameter, PlanTask, PlanTaskType} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ensureArray} from '@oniichan/shared/array';
import {ToolImplementBase} from './base';
import type {ToolExecuteResult} from './base';

function consumeTaskArray(content: RawToolCallParameter, taskType: PlanTaskType) {
    const transform = (text: string): PlanTask => {
        return {
            taskType,
            text,
            status: 'pending',
        };
    };
    return ensureArray(content).map(transform);
}

export class CreatePlanToolImplement extends ToolImplementBase<CreatePlanParameter> {
    async executeApprove(args: CreatePlanParameter): Promise<ToolExecuteResult> {
        const firstTask = args.tasks.at(0);

        if (!firstTask) {
            throw new Error('There is no task in plan');
        }

        firstTask.status = 'executing';
        const paragraphs = [
            'You are in the state of completing one single task in the plan.',
            'The execution of the plan is a very serious process, you should carefully pick tasks from the plan, finish each task step by step.',
            'Any action outside the scope of this plan is strictly prohibited, if the plan does not explicitly include any task to write code, you are now allowed to do any creation, modification or deleteion of files.',
            'This is the task you are currently asked to handle:',
            firstTask.text,
        ];
        return {
            type: 'success',
            finished: false,
            output: paragraphs.join('\n\n'),
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<CreatePlanParameter> {
        return {
            tasks: [
                ...consumeTaskArray(generated.read, 'read'),
                ...consumeTaskArray(generated.coding, 'coding'),
            ],
        };
    }
}
