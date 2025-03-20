import type {ChatInputPayload} from '@oniichan/shared/model';
import {ChatContextProvider} from './base';
import {SystemPromptGenerator} from './prompt';
import type {SystemPromptGeneratorInit} from './prompt';
import type {AssistantRole} from '@oniichan/shared/inbox';

export class StandaloneChatContextProvider extends ChatContextProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        return 'standalone';
    }

    protected async provideModelName(): Promise<string | undefined> {
        return undefined;
    }

    protected async provideChatMessages(): Promise<ChatInputPayload[]> {
        return this.thread.toMessages().map(v => v.toChatInputPayload());
    }

    protected async provideSystemPrompt(): Promise<string> {
        const generatorInit: SystemPromptGeneratorInit = {
            role: 'standalone',
            workingMode: 'normal',
            modelFeature: await this.modelAccess.getModelFeature(),
            logger: this.logger,
            references: this.references,
            editorHost: this.editorHost,
        };
        const generator = new SystemPromptGenerator(generatorInit);
        return generator.renderSystemPrompt();
    }
}
