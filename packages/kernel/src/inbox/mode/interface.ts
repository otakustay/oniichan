import type {AssistantRole, MessageInputChunk} from '@oniichan/shared/inbox';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../interface';

export interface ChatRole {
    provideModelOverride(): string | undefined;

    provideToolSet(): ToolDescription[];

    provideObjective(): string;

    provideRoleName(): AssistantRole;

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[];
}

export interface ChatCapabilityProvider {
    provideChatStream(): AsyncIterable<MessageInputChunk>;

    provideChatRole(): ChatRole;
}
