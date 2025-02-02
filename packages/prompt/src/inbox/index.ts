import {ToolDescription} from '@oniichan/shared/tool';
import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';
import {renderRuleSection} from './rule';
import {renderFormatSection} from './format';
import {renderToolSection} from './tool';
import {renderEmbeddingAsChunkSection} from './embeddingAsChunk';
import {renderEmbeddingAsFullContentSection} from './embeddingAsFullContent';
import {renderEmbeddingAsNameOnlySection} from './embeddingAsNameOnly';
import {renderRootEntriesSection} from './rootEntries';
import {renderObjectiveSection} from './objective';

export interface InboxPromptView {
    tools: ToolDescription[];
    embeddingAsChunk: EmbeddingSearchResultItem[];
    embeddingAsFullContent: EmbeddingSearchResultItem[];
    embeddingAsNameOnly: EmbeddingSearchResultItem[];
    rootEntries: string[];
}

export async function renderInboxSystemPrompt(view: InboxPromptView) {
    const parts = [
        renderRuleSection(),
        renderFormatSection(),
        renderToolSection(view.tools),
        '# Context',
        'This section provides some already known information for user\'s request.',
        view.rootEntries.length ? renderRootEntriesSection(view.rootEntries) : '',
        view.embeddingAsChunk.length ? renderEmbeddingAsChunkSection(view.embeddingAsChunk) : '',
        view.embeddingAsFullContent.length ? renderEmbeddingAsFullContentSection(view.embeddingAsFullContent) : '',
        view.embeddingAsNameOnly.length ? renderEmbeddingAsNameOnlySection(view.embeddingAsNameOnly) : '',
        renderObjectiveSection(),
    ];
    return parts.filter(v => !!v).join('\n\n');
}
