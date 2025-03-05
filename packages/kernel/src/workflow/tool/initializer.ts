import {assertAssistantTextMessage, InboxWorkflowOriginMessage, transferToToolCallMessage} from '../../inbox';
import {WorkflowInitializer, WorkflowStepInit} from '../base';
import {ToolImplement, ToolImplementInit} from './implement';

export class ToolWorkflowInitializer extends WorkflowInitializer {
    private readonly implement: ToolImplement;

    constructor(init: WorkflowStepInit) {
        super(init);
        const implementInit: ToolImplementInit = {
            roundtrip: this.roundtrip,
            editorHost: init.editorHost,
            logger: init.logger,
            commandExecutor: init.commandExecutor,
            inboxConfig: init.inboxConfig,
        };
        this.implement = new ToolImplement(implementInit);
    }

    async createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage> {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);

        const chunk = source.findToolCallChunkStrict();
        // It's already validated, so `extractArguments` is guaranteed to return a valid object
        const args = this.implement.extractArguments(chunk.toolName, chunk.arguments);
        return transferToToolCallMessage(source, args);
    }
}
