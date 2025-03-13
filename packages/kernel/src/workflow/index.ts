import {ToolWorkflowRunner} from './tool';
import {PlanWorkflowRunner} from './plan';
import {WorkflowRunner} from './base';
import type {WorkflowStepInit} from './base';

export {WorkflowRunner};
export type {WorkflowStepInit};

export class WorkflowDetector {
    private readonly context: WorkflowStepInit;

    constructor(init: WorkflowStepInit) {
        this.context = {
            ...init,
            logger: init.logger.with({source: 'WorkflowDetector', taskId: init.taskId}),
        };
    }

    detectWorkflow(): WorkflowRunner | null {
        const runners = this.initializeWorkflowRunners();
        const runner = runners.find(v => v.detect());
        return runner ?? null;
    }

    private initializeWorkflowRunners(): WorkflowRunner[] {
        return [
            new ToolWorkflowRunner(this.context),
            new PlanWorkflowRunner(this.context),
        ];
    }
}
