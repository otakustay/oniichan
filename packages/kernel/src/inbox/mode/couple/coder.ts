import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxAssistantTextMessage, InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import {pickSharedTools} from '../tool';

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
        // Coder is triggered inside `write_file` and `patch_file` tool
        return pickSharedTools(
            'write_file',
            'patch_file'
        );
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
