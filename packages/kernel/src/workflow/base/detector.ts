import type {InboxWorkflowOriginMessage, InboxWorkflowSourceMessage} from '../../inbox/index.js';
import {WorkflowStep} from './step.js';

export abstract class WorkflowDetector extends WorkflowStep {
    abstract detectWorkflow(source: InboxWorkflowSourceMessage): boolean;

    abstract ableToHandleWorkflow(origin: InboxWorkflowOriginMessage): boolean;
}
