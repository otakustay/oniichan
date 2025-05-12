import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {isToolCallMessageOf} from '../../../../inbox';
import type {InboxMessage} from '../../../../inbox';
import {ChatCapabilityProvider} from '../base';

export class HenshinChatCapabilityProvider extends ChatCapabilityProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        const messages = this.thread.toMessages();
        const isStop = (message: InboxMessage) => {
            return isToolCallMessageOf(message, 'semantic_edit_code') || isToolCallMessageOf(message, 'complete_task');
        };
        const lastStop = messages.findLast(isStop);
        const toolName = lastStop?.findToolCallChunkStrict().toolName;
        // Always use actor to start the work
        return toolName === 'semantic_edit_code' ? 'coder' : 'actor';
    }

    protected async provideModelName(): Promise<string | undefined> {
        const role = await this.provideAssistantRole();
        switch (role) {
            case 'actor':
                return this.config.actorModel;
            case 'coder':
                return this.config.coderModel || this.config.actorModel;
            default:
                throw new Error(`Henshin mode does not support role ${role}`);
        }
    }

    protected async provideChatMessages(): Promise<ChatInputPayload[]> {
        return this.getInboxMessages().map(v => v.toChatInputPayload());
    }

    protected async provideWorkingMode(): Promise<MessageThreadWorkingMode> {
        return 'henshin';
    }
}
