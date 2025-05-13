import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import {isBreakpoingToolCallMessage} from '../../../../inbox';
import type {InboxMessage} from '../../../../inbox';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';

class HenshinActorRole implements ChatRole {
    private readonly actorModelName: string;

    constructor(actorModelName: string) {
        this.actorModelName = actorModelName;
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'actor';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}

class HenshinCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    constructor(actorModelName: string, coderModelName: string | null) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        return 'coder';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}

export class HenshinChatCapabilityProvider extends ChatCapabilityProvider {
    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'henshin';
    }

    protected getChatRole(): ChatRole {
        const messages = this.thread.toMessages();
        const lastStop = messages.findLast(isBreakpoingToolCallMessage);
        const toolName = lastStop?.findToolCallChunkStrict().toolName;
        // Always use actor to start the work
        return toolName === 'semantic_edit_code'
            ? new HenshinCoderRole(this.config.actorModel, this.config.coderModel)
            : new HenshinActorRole(this.config.actorModel);
    }
}
