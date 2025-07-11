import {renderRuleSection} from './rule.js';
import {renderFormatSection} from './format.js';
import {renderToolSection} from './tool.js';
import {renderStructureSection} from './structure.js';
import {renderReferenceSection} from './reference.js';
import type {InboxPromptView, InboxPromptReference} from './interface.js';

export type {InboxPromptView, InboxPromptReference};

export async function renderInboxSystemPrompt(view: InboxPromptView) {
    const parts = [
        renderRuleSection(view),
        renderFormatSection(),
        renderToolSection(view),
        '# Context',
        'This section provides some already known information for user\'s request.',
        view.projectStructure ? renderStructureSection(view) : '',
        view.references.length ? renderReferenceSection(view) : '',
        '# Objective',
        view.objectiveInstruction,
    ];
    return parts.filter(v => !!v).join('\n\n');
}
