import {assertAssistantTextMessage, transferToToolCallMessage} from '../../inbox';
import type {InboxWorkflowOriginMessage} from '../../inbox';
import {WorkflowInitializer} from '../base';
import type {WorkflowStepInit} from '../base';
import {ToolImplement} from './implement';
import type {ToolImplementInit} from './implement';

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
        // Raw parameters are already validated, it will result a parsed strong typed object
        const args = this.implement.parseArguments(chunk.toolName, chunk.arguments);
        return transferToToolCallMessage(source, args);
    }
}
