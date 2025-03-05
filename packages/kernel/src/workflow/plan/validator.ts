import {WorkflowValidator} from '../base';

export class PlanWorkflowValidator extends WorkflowValidator {
    async validateWorkflow(): Promise<boolean> {
        return true;
    }
}
