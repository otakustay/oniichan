import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole} from '@oniichan/shared/inbox';
import {isToolCallMessageOf} from '../../../inbox';
import type {InboxMessage} from '../../../inbox';
import {ChatCapabilityProvider} from './base';
import {SystemPromptGenerator} from './prompt';
import type {SystemPromptGeneratorInit} from './prompt';

export class HenshinChatCapabilityProvider extends ChatCapabilityProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        return this.getHenshinRole();
    }

    protected async provideModelName(): Promise<string | undefined> {
        const role = this.getHenshinRole();
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

    protected async provideSystemPrompt(): Promise<string> {
        const generatorInit: SystemPromptGeneratorInit = {
            role: this.getHenshinRole(),
            workingMode: 'henshin',
            modelFeature: await this.modelAccess.getModelFeature(),
            logger: this.logger,
            references: this.references,
            editorHost: this.editorHost,
        };
        const generator = new SystemPromptGenerator(generatorInit);
        return generator.renderSystemPrompt();
    }

    private getHenshinRole(): AssistantRole {
        const messages = this.thread.toMessages();
        const isStop = (message: InboxMessage) => {
            return isToolCallMessageOf(message, 'semantic_edit_code') || isToolCallMessageOf(message, 'complete_task');
        };
        const lastStop = messages.findLast(isStop);
        const toolName = lastStop?.findToolCallChunkStrict().toolName;
        // Always use actor to start the work
        return toolName === 'semantic_edit_code' ? 'coder' : 'actor';
    }
}
