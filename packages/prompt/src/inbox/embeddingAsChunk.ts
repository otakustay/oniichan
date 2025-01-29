import {EmbeddingSearchResultItem} from '@oniichan/shared/inbox';

function renderItem(item: EmbeddingSearchResultItem) {
    const lines = [
        `## ${item.file} line ${item.startLine}-${item.endLine}`,
        '',
        '```',
        item.content,
        '```',
    ];
    return lines.join('\n');
}

export function renderEmbeddingAsChunkSection(items: EmbeddingSearchResultItem[]) {
    const paragraphs = [
        '## Code Reference',
        'We already have some code related to user\'s query in this project which you can reference, they are **a part of** an existing code file, you are encouraged to read the entire file content again if you find one piece of code useful but does not contain enough information.',
        ...items.map(renderItem),
    ];
    return paragraphs.join('\n\n');
}
