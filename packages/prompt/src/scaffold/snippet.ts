export interface ScaffoldSnippetView {
    path: string;
    content: string;
}

export function renderSnippetItem(item: ScaffoldSnippetView) {
    const lines = [
        `File ${item.path} contains this:`,
        '',
        '```',
        item.content,
        '```',
    ];
    return lines.join('\n');
}
