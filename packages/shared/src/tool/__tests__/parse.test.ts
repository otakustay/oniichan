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
    toolName: string;
    args: Record<string, string>;
}

async function consume(content: string) {
    const calls: ToolCall[] = [];
    const parser = new StreamingToolParser();
    for await (const chunk of parser.parse(tokenize(content))) {
        switch (chunk.type) {
            case 'toolStart':
                calls.push({toolName: chunk.toolName, args: {}});
                break;
            case 'toolDelta': {
                const call = calls.at(-1);
                if (call) {
                    for (const [key, value] of Object.entries(chunk.arguments)) {
                        if (call.args[key] === undefined) {
                            call.args[key] = value;
                        }
                        else {
                            call.args[key] += value;
                        }
                    }
                }
                break;
            }
        }
    }
    return calls;
}

test('simple tool call', async () => {
    const message = dedent`
        Start tool call.

        <readFile>
            <path>src/main.ts</path>
        </readFile>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    expect(tools.at(0)).toEqual({toolName: 'readFile', args: {path: 'src/main.ts'}});
});

test('multiple parameters', async () => {
    const message = dedent`
        Start tool call.

        <readDirectory>
        <path>src/main.ts</path>
        <recursive>true</recursive>
        </readDirectory>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    expect(tools.at(0)).toEqual({toolName: 'readDirectory', args: {path: 'src/main.ts', recursive: 'true'}});
});

test('cross line parameters', async () => {
    const message = dedent`
        Start tool call.

        <readDirectory>
        <path>src/
        main.ts</path>
        <recursive>true</recursive>
        </readDirectory>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    expect(tools.at(0)).toEqual({toolName: 'readDirectory', args: {path: 'src/\nmain.ts', recursive: 'true'}});
});
