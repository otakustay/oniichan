import {assertNever} from '../error';
import {MessageContentChunk, ToolCallMessageChunk, MessageType, ThinkingMessageChunk} from './message';

export function isToolCallChunk(chunk: MessageContentChunk): chunk is ToolCallMessageChunk {
    return chunk.type === 'toolCall';
}

export function isReactiveToolCallChunk(chunk: MessageContentChunk) {
    return isToolCallChunk(chunk)
        && chunk.toolName !== 'ask_followup_question'
        && chunk.toolName !== 'attempt_completion';
}

export function isAssistantMessage(type: MessageType) {
    return type === 'assistantText' || type === 'toolCall';
}

export function chunkToString(chunk: MessageContentChunk) {
    switch (chunk.type) {
        case 'text':
            return chunk.content;
        case 'thinking':
            return `<thinking>${chunk.content}</thinking>`;
        case 'toolCall':
            return chunk.source;
        default:
            assertNever<{type: string}>(chunk, v => `Unknown chunk type ${v.type}`);
    }
}

type MaybeChunk = MessageContentChunk | undefined;

export function assertThinkingChunk(chunk: MaybeChunk, message: string): asserts chunk is ThinkingMessageChunk {
    if (chunk?.type !== 'thinking') {
        throw new Error(message);
    }
}

export function assertToolCallChunk(chunk: MaybeChunk, message: string): asserts chunk is ToolCallMessageChunk {
    if (chunk?.type !== 'toolCall') {
        throw new Error(message);
    }
}

export function normalizeArguments(input: Record<string, string | undefined>) {
    // A parameter's value can have heading and trailing newlines, these forms are identical:
    //
    // ```
    // <path>
    // src/main.ts
    // </path>
    // ```

    // ```
    // <path>
    //   src/main.ts
    // </path>
    // ```
    //
    // ```
    // <path>src/main.ts</path>
    // ```
    const output: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(input)) {
        if (value) {
            output[key] = value.replaceAll(/^\n\s*|\n$/g, '');
        }
    }
    return output;
}
