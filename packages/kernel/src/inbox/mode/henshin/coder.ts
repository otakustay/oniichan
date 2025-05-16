import type {AssistantRole} from '@oniichan/shared/inbox';
import {getModelFeature} from '@oniichan/shared/model';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import {renderCommonObjective} from '../prompt';
import type {ChatRole} from '../interface';
import {pickSharedTools} from '../tool';
import {completeCoderTask} from './tool';

export class HenshinCoderRole implements ChatRole {
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
        return [
            ...pickSharedTools(
                'read_file',
                'read_directory',
                'find_files_by_glob',
                'find_files_by_regex',
                'write_file',
                'patch_file',
                'delete_file',
                'run_command',
                'browser_preview'
            ),
            completeCoderTask,
        ];
    }

    provideObjective(): string {
        const feature = getModelFeature(this.actorModelName);
        return renderCommonObjective({requireThinking: feature.requireToolThinking});
    }

    provideRoleName(): AssistantRole {
        return 'coder';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
