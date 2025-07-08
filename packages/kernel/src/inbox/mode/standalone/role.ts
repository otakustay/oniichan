import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool';
import {pickSharedTools, ToolImplementFactory} from '../tool';

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

export class StandaloneRole implements ChatRole {
    private readonly defaultModelName: string;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(defaultModelName: string) {
        this.defaultModelName = defaultModelName;
        this.toolFactory.registerShared(...tools);
    }

    provideModelOverride(): string | undefined {
        return undefined;
    }

    provideToolSet(): ToolDescription[] {
        return pickSharedTools(...tools);
    }

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement {
        return this.toolFactory.create(toolName, init);
    }

    provideObjective(): string {
        const feature = getModelFeature(this.defaultModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): string {
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
