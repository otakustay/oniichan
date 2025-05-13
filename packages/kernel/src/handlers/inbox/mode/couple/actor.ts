import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../../../inbox';
import {renderCommonObjective} from '../base/prompt';
import type {ChatRole} from '../base/provider';

export class CoupleActorRole implements ChatRole {
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
        const feature = getModelFeature(this.actorModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): AssistantRole {
        // Couple mode always behaves as standalone
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
