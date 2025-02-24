import {renderRuleSection} from './rule';
import {renderFormatSection} from './format';
import {renderToolSection} from './tool';
import {renderStructureSection} from './structure';
import {renderObjectiveSection} from './objective';
import {renderReferenceSection} from './reference';
import {InboxPromptView, InboxPromptReference} from './interface';

export {InboxPromptView, InboxPromptReference};

export async function renderInboxSystemPrompt(view: InboxPromptView) {
    const parts = [
        renderRuleSection(view),
        renderFormatSection(),
        renderToolSection(view),
        '# Context',
        'This section provides some already known information for user\'s request.',
        view.projectStructure ? renderStructureSection(view) : '',
        view.references.length ? renderReferenceSection(view) : '',
        renderObjectiveSection(view),
    ];
    return parts.filter(v => !!v).join('\n\n');
}
