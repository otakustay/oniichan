import {ModelFeature} from '@oniichan/shared/model';
import {ToolDescription} from '@oniichan/shared/tool';

export interface InboxPromptView {
    tools: ToolDescription[];
    projectStructure: string;
    projectStructureTruncated: boolean;
    modelFeature: ModelFeature;
}
