import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface.js';
import {renderCommonObjective} from '../prompt.js';
import type {ChatRole} from '../interface.js';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool/index.js';
import {pickSharedTools, ToolImplementFactory} from '../tool/index.js';

const tools: SharedToolName[] = [
    'read_file',
    'read_directory',
    'find_files_by_glob',
    'find_files_by_regex',
    'write_file',
    'patch_file',
    'delete_file',
    'run_command',
    'evaluate_code',
    'browser_preview',
    'attempt_completion',
    'ask_followup_question',
];

export class CoupleActorRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(actorModelName: string) {
        this.actorModelName = actorModelName;
        this.toolFactory.registerShared(...tools);
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
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
        // Couple mode always behaves as standalone
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
