import {WorkflowStep} from './step';

export interface WorkflowExecuteResult {
    /** Whether we should automatically request LLM again on workflow completion */
    finished: boolean;
}

export abstract class WorkflowExecutor extends WorkflowStep {
    abstract executeWorkflow(): Promise<WorkflowExecuteResult>;

    getWorkflow() {
        return this.roundtrip.getLatestWorkflowStrict();
    }

    protected isWorkflowRunning() {
        return this.getWorkflow().getStatus() === 'running';
    }
}
