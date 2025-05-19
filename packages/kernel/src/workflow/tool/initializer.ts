import {assertAssistantTextMessage, transferToToolCallMessage} from '../../inbox';
import type {InboxWorkflowOriginMessage, ToolProviderInit} from '../../inbox';
import {WorkflowInitializer} from '../base';

export class ToolWorkflowInitializer extends WorkflowInitializer {
    async createWorkflowOrigin(): Promise<InboxWorkflowOriginMessage> {
        const source = this.getWorkflowSourceMessageStrict();
        assertAssistantTextMessage(source);

        const chunk = source.findToolCallChunkStrict();
        const init: ToolProviderInit = {
            thread: this.thread,
            roundtrip: this.roundtrip,
            editorHost: this.editorHost,
            logger: this.logger,
            commandExecutor: this.commandExecutor,
            inboxConfig: this.inboxConfig,
        };
        const implement = this.role.provideToolImplement(chunk.toolName, init);
        // Raw parameters are already validated, it will result a parsed strong typed object
        const args = implement.parseArguments(chunk.arguments);
        return transferToToolCallMessage(source, args);
    }
}
