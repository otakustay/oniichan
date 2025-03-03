import {InboxWorkflowOriginMessage, InboxWorkflowSourceMessage} from '../../inbox';
import {WorkflowStep} from './step';

export abstract class WorkflowDetector extends WorkflowStep {
    abstract detectWorkflow(source: InboxWorkflowSourceMessage): boolean;

    abstract ableToHandleWorkflow(origin: InboxWorkflowOriginMessage): boolean;
}
