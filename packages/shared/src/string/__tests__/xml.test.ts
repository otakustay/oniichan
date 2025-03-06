import {describe, expect, test} from 'vitest';
import dedent from 'dedent';
import {XmlParsedChunk, StreamXmlParser} from '../xml';

async function* tokenize(content: string): AsyncIterable<string> {
    const tokens = content.split(/([^a-zA-Z0-9]+)/);
    for (const token of tokens) {
        yield token;
        await Promise.resolve();
    }
}

async function parse(content: string) {
    const parser = new StreamXmlParser();
    const chunks: XmlParsedChunk[] = [];
    for await (const chunk of parser.parse(tokenize(content))) {
        chunks.push(chunk);
    }
    return chunks;
}

function readContent(chunks: XmlParsedChunk[]): string {
    return chunks.map(v => v.type === 'text' ? v.content : v.source).join('');
}

describe('StreamXmlParser', () => {
    test('keep token', async () => {
        const message = 'Hello World';
        const chunks = await parse(message);
        expect(chunks.length).toBe(3);
    });

    test('no xml', async () => {
        const message = dedent`
            I'll help you analyze potential memory leak risks in your project. Let me first examine the codebase to identify areas where memory leaks might occur.

            Let me start by looking at the current file you have open, which appears to be related to IPC (Inter-Process Communication) handling.
        `;
        const chunks = await parse(message);
        expect(chunks.every(v => v.type === 'text')).toBe(true);
        expect(readContent(chunks)).toBe(message);
    });

    test('single xml tag', async () => {
        const message = dedent`
            Now I need to check the index.ts file to remove chunk-related code.

            <read_file>
                src/helper/index.ts
            </read_file>

            Now I'll update the index.ts file to remove the chunk-related import and interface method.
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'read_file', source: '<read_file>'});
        expect(tags.at(1)).toEqual({type: 'tagEnd', tagName: 'read_file', source: '</read_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('nested xml tag', async () => {
        const message = dedent`
            <read_file>
            <path>
                src/helper/index.ts
            </path>
            </read_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'read_file', source: '<read_file>'});
        expect(tags.at(1)).toEqual({type: 'tagStart', tagName: 'path', source: '<path>'});
        expect(tags.at(2)).toEqual({type: 'tagEnd', tagName: 'path', source: '</path>'});
        expect(tags.at(3)).toEqual({type: 'tagEnd', tagName: 'read_file', source: '</read_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('with indentation', async () => {
        const message = dedent`
            <read_file>
                <path>
                    src/helper/index.ts
                </path>
            </read_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'read_file', source: '<read_file>'});
        expect(tags.at(1)).toEqual({type: 'tagStart', tagName: 'path', source: '<path>'});
        expect(tags.at(2)).toEqual({type: 'tagEnd', tagName: 'path', source: '</path>'});
        expect(tags.at(3)).toEqual({type: 'tagEnd', tagName: 'read_file', source: '</read_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('single line tag', async () => {
        const message = dedent`
            Now I need to check the i
            <read_file>
                <path>src/helper/index.ts</path>
            </read_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'read_file', source: '<read_file>'});
        expect(tags.at(1)).toEqual({type: 'tagStart', tagName: 'path', source: '<path>'});
        expect(tags.at(2)).toEqual({type: 'tagEnd', tagName: 'path', source: '</path>'});
        expect(tags.at(3)).toEqual({type: 'tagEnd', tagName: 'read_file', source: '</read_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('ignore start tag in middle of line', async () => {
        const message = dedent`
            <write_file>
                Hello, this is <path>src/helper/index.ts
            </write_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'write_file', source: '<write_file>'});
        expect(tags.at(1)).toEqual({type: 'tagEnd', tagName: 'write_file', source: '</write_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('tag match', async () => {
        const message = dedent`
            <write_file>
                Hello, this is <path>src/helper/index.ts</path>
            </write_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'write_file', source: '<write_file>'});
        expect(tags.at(1)).toEqual({type: 'tagEnd', tagName: 'write_file', source: '</write_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('mixed tag and text', async () => {
        const message = dedent`
            <write_file>Hello!
                Nice day.</write_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'write_file', source: '<write_file>'});
        expect(tags.at(1)).toEqual({type: 'tagEnd', tagName: 'write_file', source: '</write_file>'});
        expect(readContent(chunks)).toBe(message);
    });

    test('invalid tag name', async () => {
        const message = dedent`
            <html lang="en"></html>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.length).toBe(0);
    });

    test('deepseek r1 double <', async () => {
        const message = dedent`
            <<read_file>
                <<path>
                src/helper/index.ts
            </path>
            </read_file>
        `;
        const chunks = await parse(message);
        const tags = chunks.filter(v => v.type !== 'text');
        expect(tags.at(0)).toEqual({type: 'tagStart', tagName: 'read_file', source: '<<read_file>'});
        expect(tags.at(1)).toEqual({type: 'tagStart', tagName: 'path', source: '<<path>'});
        expect(tags.at(2)).toEqual({type: 'tagEnd', tagName: 'path', source: '</path>'});
        expect(tags.at(3)).toEqual({type: 'tagEnd', tagName: 'read_file', source: '</read_file>'});
        expect(readContent(chunks)).toBe(message);
    });
});
