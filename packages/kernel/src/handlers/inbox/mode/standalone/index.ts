import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {ChatCapabilityProvider} from '../base';

export class StandaloneChatCapabilityProvider extends ChatCapabilityProvider {
    async provideAssistantRole(): Promise<AssistantRole> {
        return 'standalone';
    }

    protected async provideModelName(): Promise<string | undefined> {
        return undefined;
    }

    protected async provideChatMessages(): Promise<ChatInputPayload[]> {
        return this.getInboxMessages().map(v => v.toChatInputPayload());
    }

    protected async provideWorkingMode(): Promise<MessageThreadWorkingMode> {
        return 'normal';
    }
}
