import {InboxPromptReference, InboxPromptView} from './interface';

function renderFileReference(reference: InboxPromptReference) {
    const lines = [
        `## ${reference.file}`,
        '',
        '```',
        reference.content,
        '```',
    ];
    return lines.join('\n');
}

export function renderReferenceSection(view: InboxPromptView) {
    const parts = [
        '## References',
        'These files are directly referenced by user as a background of his request, you can use them as a source of truth **for the first request**, however they can be obsolete after that, be carefuly for it and read file\'s content again if you have edited it.',
        ...view.references.map(renderFileReference),
    ];
    return parts.join('\n\n');
}
