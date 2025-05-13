import type {AssistantRole, MessageThreadWorkingMode} from '@oniichan/shared/inbox';

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
    customRules: string;
    references: InboxPromptReference[];
    objectiveInstruction: string;
}
