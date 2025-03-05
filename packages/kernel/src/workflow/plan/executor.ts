import dedent from 'dedent';
import {assertPlanMessage, createDetachedUserRequestMessage} from '../../inbox';
import {WorkflowExecuteResult, WorkflowExecutor} from '../base';

const responseText = dedent`
    Now you should start to accomplish this plan.

    The execution of the plan is a very serious process, you should carefully pick tasks from the plan, finish each task step by step.

    Any action outside the scope of this plan is strictly prohibited, if the plan does not explicitly include any task to write code, you are now allowed to do any creation, modification or deleteion of files.
`;

export class PlanWorkflowExecutor extends WorkflowExecutor {
    async executeWorkflow(): Promise<WorkflowExecuteResult> {
        const workflow = this.getWorkflow();
        const reply = createDetachedUserRequestMessage(responseText);
        workflow.addReaction(reply, true);
        const origin = workflow.getOriginMessage();
        assertPlanMessage(origin);
        return {finished: origin.getPlanState() === 'conclusion'};
    }
}
