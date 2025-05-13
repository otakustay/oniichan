import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../../../inbox';
import type {ChatRole} from '../base/provider';
import {renderCommonObjective} from '../base/prompt';
import {serializeExecutorMessage} from './utils';

export class RingRingCoderRole implements ChatRole {
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
        const feature = getModelFeature(this.actorModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): AssistantRole {
        return 'coder';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(serializeExecutorMessage);
    }
}
