import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxAssistantTextMessage, InboxMessage} from '../../../../inbox';
import {renderCommonObjective} from '../base/prompt';
import type {ChatRole} from '../base/provider';

export class CoupleCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    private readonly partialReply: InboxAssistantTextMessage;

    constructor(actorModelName: string, coderModelName: string | null, reply: InboxAssistantTextMessage) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
        this.partialReply = reply;
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        const feature = getModelFeature(this.coderModelName || this.actorModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): AssistantRole {
        // Couple mode always behaves as standalone
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return [...messages, this.partialReply].map(v => v.toChatInputPayload());
    }
}
