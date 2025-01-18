export interface CodeBlock {
    tag: string;
    content: string;
}

export function extractCodeBlocksFromMarkdown(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /^```(\w*)\n([\s\S]*?)```/gm;
    const trimedContent = content.replace(/\n`{1,2}$/, '');
    const matches = trimedContent.matchAll(codeBlockRegex);
    const cursor = {current: 0};

    for (const match of matches) {
        const input = match.at(0) ?? '';
        cursor.current = match.index + input.length;
        const tag = match.at(1) || 'text';
        const content = match.at(2) || '';
        codeBlocks.push({tag, content: content.trimEnd()});
    }

    const remaining = trimedContent.slice(cursor.current);
    const unclosedCodeBlockRegex = /^```(\w*)\n([\s\S]*)$/m;
    const match = unclosedCodeBlockRegex.exec(remaining);
    if (match) {
        const tag = match.at(1) || 'text';
        const content = match.at(2);
        codeBlocks.push({tag, content: (content ?? '').trimEnd()});
    }

    return codeBlocks;
}
