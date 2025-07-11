import type {InboxWorkflowOriginMessage} from '../../inbox/index.js';
import {WorkflowStep} from './step.js';

export abstract class WorkflowInitializer extends WorkflowStep {
    abstract createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage>;
}
