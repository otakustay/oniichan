import {assertAssistantTextMessage} from '../../inbox/index.js';
import type {InboxWorkflowOriginMessage, InboxWorkflowSourceMessage} from '../../inbox/index.js';
import {WorkflowDetector} from '../base/index.js';

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
