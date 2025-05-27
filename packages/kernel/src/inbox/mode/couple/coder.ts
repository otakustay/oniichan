import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxAssistantTextMessage, InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool';
import {pickSharedTools, ToolImplementFactory} from '../tool';

const tools: SharedToolName[] = [
    'write_file',
    'patch_file',
];

export class CoupleCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    private readonly partialReply: InboxAssistantTextMessage;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(actorModelName: string, coderModelName: string | null, reply: InboxAssistantTextMessage) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
        this.partialReply = reply;
        this.toolFactory.registerShared(...tools);
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        return pickSharedTools(...tools);
    }

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement {
        return this.toolFactory.create(toolName, init);
    }

    provideObjective(): string {
        const feature = getModelFeature(this.actorModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): string {
        return 'coder';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
