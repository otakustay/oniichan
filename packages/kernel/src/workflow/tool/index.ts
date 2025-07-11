import {WorkflowRunner} from '../base/index.js';
import type {WorkflowStepInit} from '../base/index.js';
import {ToolWorkflowDetector} from './detector.js';
import {ToolWorkflowExecutor} from './executor.js';
import {ToolWorkflowInitializer} from './initializer.js';
import {ToolWorkflowValidator} from './validator.js';

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
