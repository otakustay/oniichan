import {WorkflowRunner, WorkflowStepInit} from '../base';
import {ToolWorkflowDetector} from './detector';
import {ToolWorkflowExecutor} from './executor';
import {ToolWorkflowInitializer} from './initializer';
import {ToolWorkflowValidator} from './validator';

export class ToolWorkflowRunner extends WorkflowRunner {
    constructor(init: WorkflowStepInit) {
        super(
            init,
            {
                detector: new ToolWorkflowDetector(init),
                validator: new ToolWorkflowValidator(init),
                initializer: new ToolWorkflowInitializer(init),
                executor: new ToolWorkflowExecutor(init),
            }
        );
    }
}
