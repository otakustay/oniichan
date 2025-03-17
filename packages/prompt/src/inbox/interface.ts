import type {ModelFeature} from '@oniichan/shared/model';
import type {ToolDescription} from '@oniichan/shared/tool';

export interface InboxPromptReference {
    type: 'file';
    file: string;
    content: string;
}

export type InboxPromptRole = 'standalone' | 'planner' | 'actor' | 'coder';

export interface InboxPromptView {
    mode: InboxPromptRole;
    tools: ToolDescription[];
    projectStructure: string;
    projectStructureTruncated: boolean;
    modelFeature: ModelFeature;
    customRules: string;
    references: InboxPromptReference[];
}
