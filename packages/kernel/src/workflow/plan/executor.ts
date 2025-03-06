import {assertPlanMessage} from '../../inbox';
import {WorkflowExecuteResult, WorkflowExecutor} from '../base';

export class PlanWorkflowExecutor extends WorkflowExecutor {
    async executeWorkflow(): Promise<WorkflowExecuteResult> {
        const workflow = this.getWorkflow();
        const origin = workflow.getOriginMessage();
        assertPlanMessage(origin);

        if (origin.getPlanState() === 'conclusion') {
            return {finished: true};
        }

        const task = origin.pickFirstPendingTask();

        if (!task) {
            origin.setError('This plan has no task');
            return {finished: true};
        }

        const paragraphs = [
            'Now you should start to accomplish this plan.',
            'The execution of the plan is a very serious process, you should carefully pick tasks from the plan, finish each task step by step.',
            'Any action outside the scope of this plan is strictly prohibited, if the plan does not explicitly include any task to write code, you are now allowed to do any creation, modification or deleteion of files.',
            'This is the task you are currently asked to handle:',
            task.text,
        ];
        workflow.addTextReaction(paragraphs.join('\n\n'), true);
        task.status = 'executing';
        return {finished: false};
    }
}
