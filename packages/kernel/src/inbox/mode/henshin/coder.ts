import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool';
import {pickSharedTools, ToolImplementFactory} from '../tool';
import {completeCoderTask, CompleteCoderTaskToolImplement} from './completeCoderTask';

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
];

export class HenshinCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(actorModelName: string, coderModelName: string | null) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
        this.toolFactory.registerShared(...tools);
        this.toolFactory.register('complete_task', CompleteCoderTaskToolImplement);
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        return [
            ...pickSharedTools(...tools),
            completeCoderTask,
        ];
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
