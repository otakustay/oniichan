import {WorkflowRunner} from '../base';
import type {WorkflowStepInit} from '../base';
import {PlanWorkflowDetector} from './detector';
import {PlanWorkflowExecutor} from './executor';
import {PlanWorkflowInitializer} from './initializer';
import {PlanWorkflowValidator} from './validator';

export class PlanWorkflowRunner extends WorkflowRunner {
    constructor(init: WorkflowStepInit) {
        super(
            init,
            {
                detector: new PlanWorkflowDetector(init),
                validator: new PlanWorkflowValidator(init),
                initializer: new PlanWorkflowInitializer(init),
                executor: new PlanWorkflowExecutor(init),
            }
        );
    }
}
