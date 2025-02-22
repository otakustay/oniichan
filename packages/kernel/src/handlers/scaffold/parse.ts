import {StreamXmlParser} from '@oniichan/shared/string';

interface ParseState {
    context: 'text' | 'import' | 'definition';
}

export interface ParsedChunk {
    section: 'import' | 'definition';
    code: string;
}

export async function* consumeModelResponse(stream: AsyncIterable<string>): AsyncIterable<ParsedChunk> {
    const parser = new StreamXmlParser();
    const state: ParseState = {
        context: 'text',
    };

    for await (const chunk of parser.parse(stream)) {
        if (chunk.type === 'text') {
            if (state.context !== 'text') {
                yield {section: state.context, code: chunk.content};
            }
        }
        else if (chunk.type === 'tagStart') {
            if (state.context === 'text' && (chunk.tagName === 'import' || chunk.tagName === 'definition')) {
                state.context = chunk.tagName;
            }
        }
        else if (chunk.type === 'tagEnd') {
            if (state.context === chunk.tagName) {
                state.context = 'text';
            }
        }
    }
}
