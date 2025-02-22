import {test, expect} from 'vitest';
import dedent from 'dedent';
import {StreamingToolParser} from '../parse';

async function* tokenize(content: string): AsyncIterable<string> {
    const tokens = content.split(/([^a-zA-Z0-9]+)/);
    for (const token of tokens) {
        yield token;
        await Promise.resolve();
    }
}

interface ToolCall {
    type: 'tool';
    toolName: string;
    args: Record<string, string>;
    closed: boolean;
}

interface Thinking {
    type: 'thinking';
    content: string;
}

async function consume(content: string) {
    const chunks: Array<ToolCall | Thinking> = [];
    const parser = new StreamingToolParser();
    for await (const chunk of parser.parse(tokenize(content))) {
        if (chunk.type === 'text') {
            continue;
        }
        if (chunk.type === 'toolStart') {
            chunks.push({type: 'tool', toolName: chunk.toolName, args: {}, closed: false});
            continue;
        }
        if (chunk.type === 'thinkingStart') {
            chunks.push({type: 'thinking', content: ''});
            continue;
        }

        if (!chunks.length) {
            throw new Error(`Chunk of type ${chunk.type} occured without start`);
        }

        const lastChunk = chunks.at(-1);

        if (/tool/i.test(chunk.type) && lastChunk?.type !== 'tool') {
            throw new Error('Unexpected tool chunk');
        }

        if (/thinking/i.test(chunk.type) && lastChunk?.type !== 'thinking') {
            throw new Error('Unexpected thinking chunk');
        }

        if (chunk.type === 'toolDelta') {
            const call = chunks.at(-1);
            if (call?.type === 'tool') {
                for (const [key, value] of Object.entries(chunk.arguments)) {
                    if (call.args[key] === undefined) {
                        call.args[key] = value;
                    }
                    else {
                        call.args[key] += value;
                    }
                }
            }
        }
        if (chunk.type === 'thinkingDelta') {
            const call = chunks.at(-1);
            if (call?.type === 'thinking') {
                call.content += chunk.source;
            }
        }

        if (chunk.type === 'toolEnd') {
            const call = chunks.at(-1);
            if (call?.type === 'tool') {
                call.closed = true;
            }
        }
    }
    return chunks;
}

async function recoverSource(content: string) {
    const values: string[] = [];
    const parser = new StreamingToolParser();
    for await (const chunk of parser.parse(tokenize(content))) {
        switch (chunk.type) {
            case 'text':
                values.push(chunk.content);
                break;
            default:
                values.push(chunk.source);
                break;
        }
    }
    return values.join('');
}

test('recover source', async () => {
    const message = dedent`
        Start tool call.

        <read_file>
            <path>src/main.ts</path>
        </read_file>
    `;
    const source = await recoverSource(message);
    expect(source).toBe(message);
});

test('simple tool call', async () => {
    const message = dedent`
        Start tool call.

        <read_file>
            <path>src/main.ts</path>
        </read_file>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    const expected = {
        type: 'tool',
        toolName: 'read_file',
        args: {path: 'src/main.ts'},
        closed: true,
    };
    expect(tools.at(0)).toEqual(expected);
});

test('multiple parameters', async () => {
    const message = dedent`
        Start tool call.

        <read_directory>
        <path>src/main.ts</path>
        <recursive>true</recursive>
        </read_directory>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    const expected = {
        type: 'tool',
        toolName: 'read_directory',
        args: {path: 'src/main.ts', recursive: 'true'},
        closed: true,
    };
    expect(tools.at(0)).toEqual(expected);
});

test('cross line parameters', async () => {
    const message = dedent`
        Start tool call.

        <read_directory>
        <path>src/
        main.ts</path>
        <recursive>true</recursive>
        </read_directory>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    const expected = {
        type: 'tool',
        toolName: 'read_directory',
        args: {path: 'src/\nmain.ts', recursive: 'true'},
        closed: true,
    };
    expect(tools.at(0)).toEqual(expected);
});

test('not a tool', async () => {
    const message = dedent`
        Now we can use this tool, for example:

        <run_command_test>
            <command>git status</command>
        </run_command_test>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(0);
});

test('with thinking', async () => {
    const thinkingContent = 'I should read the entry of program first, use tool read_file. - path: src/main.ts';
    const message = dedent`
        <thinking>${thinkingContent}</thinking>
        <read_file>
            <path>src/main.ts</path>
        </read_file>
    `;
    const chunks = await consume(message);
    expect(chunks.length).toBe(2);
    const expectedToolCall = {
        type: 'tool',
        toolName: 'read_file',
        args: {path: 'src/main.ts'},
        closed: true,
    };
    expect(chunks.at(0)).toEqual({type: 'thinking', content: thinkingContent});
    expect(chunks.at(1)).toEqual(expectedToolCall);
});

test('xml inside thinking', async () => {
    const thinkingContent = dedent`
        I should read the entry of program first, use tool read_file.

        <read_file>
        <path>src/main.ts</path>
        </read_file>
    `;
    const message = dedent`
        <thinking>${thinkingContent}</thinking>
        <read_file>
            <path>src/main.ts</path>
        </read_file>
    `;
    const chunks = await consume(message);
    expect(chunks.length).toBe(2);
    const expectedToolCall = {
        type: 'tool',
        toolName: 'read_file',
        args: {path: 'src/main.ts'},
        closed: true,
    };
    expect(chunks.at(0)).toEqual({type: 'thinking', content: thinkingContent});
    expect(chunks.at(1)).toEqual(expectedToolCall);
});

test('nested xml tags inside parameter', async () => {
    const content = dedent`
        <html lang="en">
            <div>Hello</div>
        </html>
    `;
    const message = dedent`
        <write_file>
        <path>src/index.html</path>
        <content>
        <html lang="en">
            <div>Hello</div>
        </html>
        </content>
        </write_file>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    const expected = {
        type: 'tool',
        toolName: 'write_file',
        args: {path: 'src/index.html', content: `\n${content}\n`},
        closed: true,
    };
    expect(tools.at(0)).toEqual(expected);
});
