import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';

export function renderEmbeddingAsNameOnlySection(items: EmbeddingSearchResultItem[]) {
    const lines = [
        '## File Reference',
        '',
        'We already have some files related to user\'s query, their paths are provided below, you are encouraged to read their content if you think one file is useful.',
        ...items.map(v => `- ${v.file}`),
    ];
    return lines.join('\n');
}
