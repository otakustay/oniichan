import {assertAssistantTextMessage, transferToPlanMessage} from '../../inbox';
import type {InboxWorkflowOriginMessage} from '../../inbox';
import {WorkflowInitializer} from '../base';

export class PlanWorkflowInitializer extends WorkflowInitializer {
    async createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage> {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);
        return transferToPlanMessage(source);
    }
}
