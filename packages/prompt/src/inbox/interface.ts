import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import type {ModelFeature} from '@oniichan/shared/model';

export interface InboxPromptReference {
    type: 'file';
    file: string;
    content: string;
}

export interface InboxPromptView {
    mode: MessageThreadWorkingMode;
    role: AssistantRole;
    projectStructure: string;
    projectStructureTruncated: boolean;
    modelFeature: ModelFeature;
    customRules: string;
    references: InboxPromptReference[];
}
