import {InboxWorkflowOriginMessage, InboxWorkflowSourceMessage} from '../../inbox';
import {WorkflowDetector} from '../base';
import {assertAssistantTextMessage} from './utils';

export class ToolWorkflowDetector extends WorkflowDetector {
    detectWorkflow(source: InboxWorkflowSourceMessage): boolean {
        try {
            assertAssistantTextMessage(source);
            return !!source.findToolCallChunk();
        }
        catch {
            return false;
        }
    }

    ableToHandleWorkflow(origin: InboxWorkflowOriginMessage): boolean {
        return origin.type === 'toolCall';
    }
}
