import {assertNever} from '../error';
import {FileEditData} from '../patch';
import {MessageContentChunk, ToolCallMessageChunk, MessageType, ThinkingMessageChunk, MessageData} from './message';

export function isToolCallChunk(chunk: MessageContentChunk): chunk is ToolCallMessageChunk {
    return chunk.type === 'toolCall';
}

export function isAssistantMessage(type: MessageType) {
    return type === 'assistantText' || type === 'toolCall';
}

export function chunkToString(chunk: MessageContentChunk) {
    switch (chunk.type) {
        case 'reasoning':
            // Although reasoning content is mapped to a `<think>` tag,
            // actually all messages omit reasoning chunks when serializing to string,
            // we expect this branch to be unreachable
            return `<think>${chunk.content}</think}`;
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

function getFileEditFromMessage(message: MessageData): FileEditData[] {
    if (message.type !== 'toolCall') {
        return [];
    }

    const toolCall = message.chunks.find(v => v.type == 'toolCall');
    return toolCall?.fileEdit ? [toolCall.fileEdit] : [];
}

export function extractFileEdits(messages: MessageData[]): Record<string, FileEditData[] | undefined> {
    const edits: Record<string, FileEditData[] | undefined> = {};
    const allEdits = messages.flatMap(getFileEditFromMessage);
    for (const edit of allEdits) {
        const fileEdits = edits[edit.file] ?? [];
        fileEdits.push(edit);
        edits[edit.file] = fileEdits;
    }
    return edits;
}
