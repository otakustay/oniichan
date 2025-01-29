import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';

function renderItem(item: EmbeddingSearchResultItem) {
    const lines = [
        `## ${item.file}`,
        '',
        '```',
        item.content,
        '```',
    ];
    return lines.join('\n');
}

export function renderEmbeddingAsFullContentSection(items: EmbeddingSearchResultItem[]) {
    const paragraphs = [
        '## Code Reference',
        'We already have some files and their content related to user\'s query, you can trust these file content, however when you have already edited a file, the content is no longer in sync, you should read it again.',
        ...items.map(renderItem),
    ];
    return paragraphs.join('\n\n');
}
