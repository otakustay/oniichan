import {renderScratchStartRuleSection, renderRuleSection} from './rule';
import {renderFormatSection} from './format';
import {renderToolSection} from './tool';
import {renderRootEntriesSection} from './rootEntries';
import {renderObjectiveSection} from './objective';
import {InboxPromptView} from './interface';

export {InboxPromptView};

export async function renderInboxSystemPrompt(view: InboxPromptView) {
    const parts = [
        view.rootEntries.length ? renderRuleSection() : renderScratchStartRuleSection(),
        renderFormatSection(),
        renderToolSection(view),
        '# Context',
        'This section provides some already known information for user\'s request.',
        view.rootEntries.length ? renderRootEntriesSection(view.rootEntries) : '',
        renderObjectiveSection(),
    ];
    return parts.filter(v => !!v).join('\n\n');
}
