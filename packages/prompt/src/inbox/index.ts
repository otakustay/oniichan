import {renderScratchStartRuleSection, renderRuleSection} from './rule';
import {renderFormatSection} from './format';
import {renderToolSection} from './tool';
import {renderStructureSection} from './structure';
import {renderObjectiveSection} from './objective';
import {InboxPromptView} from './interface';

export {InboxPromptView};

export async function renderInboxSystemPrompt(view: InboxPromptView) {
    const parts = [
        view.projectStructure ? renderRuleSection() : renderScratchStartRuleSection(),
        renderFormatSection(),
        renderToolSection(view),
        '# Context',
        'This section provides some already known information for user\'s request.',
        view.projectStructure ? renderStructureSection(view) : '',
        renderObjectiveSection(view),
    ];
    return parts.filter(v => !!v).join('\n\n');
}
