import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool';
import {pickSharedTools, ToolImplementFactory} from '../tool';
import {completeActorTask, CompleteActorTaskToolImplement} from './completeActorTask';

const tools: SharedToolName[] = [
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
];

export class SenpaiActorRole implements ChatRole {
    private readonly defaultModelName: string;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(defaultModelName: string) {
        this.defaultModelName = defaultModelName;
        this.toolFactory.registerShared(...tools);
        this.toolFactory.register('attempt_completion', CompleteActorTaskToolImplement);
    }

    provideModelOverride(): string | undefined {
        return this.defaultModelName;
    }

    provideToolSet(): ToolDescription[] {
        return [...pickSharedTools(...tools), completeActorTask];
    }

    provideToolImplement(toolName: ToolName, init: ToolProviderInit): ToolImplement {
        return this.toolFactory.create(toolName, init);
    }

    provideObjective(): string {
        const feature = getModelFeature(this.defaultModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): string {
        return 'actor';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
