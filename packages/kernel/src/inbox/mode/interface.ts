import type {AssistantRole, MessageInputChunk} from '@oniichan/shared/inbox';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../interface';
import type {ToolImplement, ToolProviderInit} from './tool';

export interface ChatRole {
    provideModelOverride(): string | undefined;

    provideToolSet(): ToolDescription[];

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement;

    provideObjective(): string;

    provideRoleName(): AssistantRole;

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[];
}

export interface ChatCapabilityProvider {
    provideChatStream(): AsyncIterable<MessageInputChunk>;

    provideChatRole(): ChatRole;
}
