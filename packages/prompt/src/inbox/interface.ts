import type {ToolDescription} from '@oniichan/shared/tool';

export interface InboxPromptReference {
    type: 'file';
    file: string;
    content: string;
}

export interface InboxPromptView {
    projectStructure: string;
    projectStructureTruncated: boolean;
    customRules: string;
    references: InboxPromptReference[];
    objectiveInstruction: string;
    tools: ToolDescription[];
}
