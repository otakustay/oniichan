import {assertAssistantTextMessage, InboxWorkflowOriginMessage, InboxWorkflowSourceMessage} from '../../inbox';
import {WorkflowDetector} from '../base';

export class PlanWorkflowDetector extends WorkflowDetector {
    detectWorkflow(source: InboxWorkflowSourceMessage): boolean {
        try {
            assertAssistantTextMessage(source);
            return !!source.findTaggedChunk('plan');
        }
        catch {
            return false;
        }
    }

    ableToHandleWorkflow(origin: InboxWorkflowOriginMessage): boolean {
        return origin.type === 'plan';
    }
}
