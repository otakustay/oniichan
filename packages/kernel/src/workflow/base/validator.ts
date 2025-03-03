import {WorkflowStep} from './step';

export abstract class WorkflowValidator extends WorkflowStep {
    abstract validateWorkflow(): Promise<boolean>;
}
