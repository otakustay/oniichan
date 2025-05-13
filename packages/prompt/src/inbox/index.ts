import {renderRuleSection} from './rule';
import {renderFormatSection} from './format';
import {renderToolSection} from './tool';
import {renderStructureSection} from './structure';
import {renderReferenceSection} from './reference';
import type {InboxPromptView, InboxPromptReference} from './interface';

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
