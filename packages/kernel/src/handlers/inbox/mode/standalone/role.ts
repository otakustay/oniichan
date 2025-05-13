import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../../../inbox';
import {renderCommonObjective} from '../base/prompt';
import type {ChatRole} from '../base/provider';

export class StandaloneRole implements ChatRole {
    private readonly defaultModelName: string;

    constructor(defaultModelName: string) {
        this.defaultModelName = defaultModelName;
    }

    provideModelOverride(): string | undefined {
        return undefined;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        const feature = getModelFeature(this.defaultModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): AssistantRole {
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
