import type {MessageInputChunk} from '@oniichan/shared/inbox';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../interface.js';
import type {ToolImplement, ToolProviderInit} from './tool/index.js';

export interface ChatRole {
    provideModelOverride(): string | undefined;

    provideToolSet(): ToolDescription[];

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement;

    provideObjective(): string;

    provideRoleName(): string;

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[];
}

export interface ChatCapabilityProvider {
    provideChatStream(): AsyncIterable<MessageInputChunk>;

    provideChatRole(): ChatRole;
}
