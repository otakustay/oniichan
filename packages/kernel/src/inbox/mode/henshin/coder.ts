import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface.js';
import {renderCommonObjective} from '../prompt.js';
import type {ChatRole} from '../interface.js';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool/index.js';
import {pickSharedTools, ToolImplementFactory} from '../tool/index.js';
import {completeCoderTask, CompleteCoderTaskToolImplement} from './completeCoderTask.js';

const tools: SharedToolName[] = [
    'read_file',
    'read_directory',
    'search_in_workspace',
    'write_file',
    'patch_file',
    'delete_file',
    'run_command',
    'evaluate_code',
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
