import type {InboxWorkflowOriginMessage} from '../../inbox';
import {WorkflowStep} from './step';

export abstract class WorkflowInitializer extends WorkflowStep {
    abstract createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage>;
}
