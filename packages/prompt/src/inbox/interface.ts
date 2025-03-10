import {ModelFeature} from '@oniichan/shared/model';
import {ToolDescription} from '@oniichan/shared/tool';

export interface InboxPromptReference {
    type: 'file';
    file: string;
    content: string;
}

export type InboxPromptMode = 'standalone' | 'plan' | 'act' | 'code';

export interface InboxPromptView {
    mode: InboxPromptMode;
    tools: ToolDescription[];
    projectStructure: string;
    projectStructureTruncated: boolean;
    modelFeature: ModelFeature;
    customRules: string;
    references: InboxPromptReference[];
}
