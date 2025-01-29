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
        if (chunk.type === 'text') {
            continue;
        }
        if (chunk.type === 'toolStart') {
            calls.push({toolName: chunk.toolName, args: {}});
            continue;
        }

        if (!calls.length) {
            throw new Error(`Chunk of type ${chunk.type} occured without start`);
        }

        if (chunk.type === 'toolDelta') {
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
        }
    }
    return calls;
}

test('simple tool call', async () => {
    const message = dedent`
        Start tool call.

        <read_file>
            <path>src/main.ts</path>
        </read_file>
    `;
    const tools = await consume(message);
    expect(tools.length).toBe(1);
    expect(tools.at(0)).toEqual({toolName: 'read_file', args: {path: 'src/main.ts'}});
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
    expect(tools.at(0)).toEqual({toolName: 'read_directory', args: {path: 'src/main.ts', recursive: 'true'}});
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
    expect(tools.at(0)).toEqual({toolName: 'read_directory', args: {path: 'src/\nmain.ts', recursive: 'true'}});
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
    // expect(tools.at(0)).toEqual({toolName: 'read_directory', args: {path: 'src/\nmain.ts', recursive: 'true'}});
});
