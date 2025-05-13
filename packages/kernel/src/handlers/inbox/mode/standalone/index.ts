import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';
import type {InboxMessage} from '../../../../inbox';

class StandaloneRole implements ChatRole {
    provideModelOverride(): string | undefined {
        return undefined;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}

export class StandaloneChatCapabilityProvider extends ChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'normal';
    }

    protected getChatRole(): ChatRole {
        return new StandaloneRole();
    }
}
