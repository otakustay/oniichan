import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import {pickSharedTools} from '../tool';

export class StandaloneRole implements ChatRole {
    private readonly defaultModelName: string;

    constructor(defaultModelName: string) {
        this.defaultModelName = defaultModelName;
    }

    provideModelOverride(): string | undefined {
        return undefined;
    }

    provideToolSet(): ToolDescription[] {
        return pickSharedTools(
            'read_file',
            'read_directory',
            'find_files_by_glob',
            'find_files_by_regex',
            'write_file',
            'patch_file',
            'delete_file',
            'run_command',
            'browser_preview',
            'attempt_completion',
            'ask_followup_question'
        );
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
