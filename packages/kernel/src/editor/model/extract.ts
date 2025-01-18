import {ModelStreamingResponse} from '@oniichan/shared/model';
import {CodeBlock, extractCodeBlocksFromMarkdown} from '@oniichan/shared/string';

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

interface ChunkItem {
    type: 'chunk';
    value: ModelStreamingResponse;
}

type Item = CodeItem | ChunkItem;

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

export async function* streamingExtractCode(input: AsyncIterable<ModelStreamingResponse>): AsyncIterable<Item> {
    const state: ExtractState = {
        codeBlocks: [],
        codeBlockIndex: -1,
        codeBlockCursor: 0,
        content: '',
    };

    for await (const chunk of input) {
        yield {type: 'chunk', value: chunk};

        if (chunk.type === 'text') {
            state.codeBlocks = extractCodeBlocksFromMarkdown(state.content);

            yield* yieldCode(state);
        }
    }
}
