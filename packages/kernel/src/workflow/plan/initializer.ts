import {assertAssistantTextMessage, InboxWorkflowOriginMessage, transferToPlanMessage} from '../../inbox';
import {WorkflowInitializer} from '../base';

export class PlanWorkflowInitializer extends WorkflowInitializer {
    async createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage> {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);
        return transferToPlanMessage(source);
    }
}
