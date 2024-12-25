interface CodeBlock {
    tag: string;
    content: string;
}

interface ExtractState {
    codeBlocks: CodeBlock[];
    codeBlockIndex: number;
    codeBlockCursor: number;
    content: string;
}

export interface CodeResult {
    index: number;
    tag: string;
    content: string;
}

interface CodeItem {
    type: 'code';
    value: CodeResult;
}

interface OtherItem<T> {
    type: 'other';
    value: T;
}

interface ChunkItem {
    type: 'chunk';
    value: string;
}

type Item<T> = CodeItem | OtherItem<T> | ChunkItem;

function extractCodeBlocks(content: string): CodeBlock[] {
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

function* yieldCode(state: ExtractState): Iterable<CodeItem> {
    if (!state.codeBlocks.length) {
        return;
    }

    if (state.codeBlockIndex < 0) {
        state.codeBlockIndex = 0;
        state.codeBlockCursor = 0;
        yield* yieldCode(state);
        return;
    }

    const codeBlock = state.codeBlocks[state.codeBlockIndex];

    if (state.codeBlockCursor < codeBlock.content.length) {
        yield {
            type: 'code',
            value: {
                index: state.codeBlockIndex,
                tag: codeBlock.tag,
                content: codeBlock.content.slice(state.codeBlockCursor),
            },
        };
        state.codeBlockCursor = codeBlock.content.length;
        yield* yieldCode(state);
        return;
    }

    if (state.codeBlockIndex >= state.codeBlocks.length - 1) {
        return;
    }

    state.codeBlockIndex++;
    state.codeBlockCursor = 0;
    yield* yieldCode(state);
}

export async function* streamingExtractCode<T>(input: AsyncIterable<string | T>): AsyncIterable<Item<T>> {
    const state: ExtractState = {
        codeBlocks: [],
        codeBlockIndex: -1,
        codeBlockCursor: 0,
        content: '',
    };

    for await (const chunk of input) {
        if (typeof chunk === 'string') {
            state.content += chunk;
            state.codeBlocks = extractCodeBlocks(state.content);

            yield* yieldCode(state);
        }
        else {
            yield {type: 'other', value: chunk};
        }
    }
}
