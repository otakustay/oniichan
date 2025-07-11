import {WorkflowStep} from './step.js';

export abstract class WorkflowValidator extends WorkflowStep {
    abstract validateWorkflow(): Promise<boolean>;
}
