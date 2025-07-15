import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';

import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface.js';
import type {ChatRole} from '../interface.js';
import {renderCommonObjective} from '../prompt.js';
import type {ToolImplement, SharedToolName, ToolProviderInit} from '../tool/index.js';
import {pickSharedTools, ToolImplementFactory} from '../tool/index.js';
import {serializeExecutorMessage} from './utils.js';
import {completeTask, CompleteTaskToolImplement} from './completeTask.js';

const tools: SharedToolName[] = [
    'read_file',
    'read_directory',
    'search_in_workspace',
    'write_file',
    'patch_file',
    'delete_file',
    'evaluate_code',
    'run_command',
    'browser_preview',
];

export class RingRingCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    private readonly toolFactory = new ToolImplementFactory();

    constructor(actorModelName: string, coderModelName: string | null) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
        this.toolFactory.registerShared(...tools);
        this.toolFactory.register('complete_task', CompleteTaskToolImplement);
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        return [
            ...pickSharedTools(...tools),
            completeTask,
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
        return messages.map(serializeExecutorMessage);
    }
}
