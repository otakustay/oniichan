import {assertNever} from '../error';
import {FileEditData} from '../patch';
import {TaggedMessageChunk, MessageData, MessageViewChunk, PlanMessageChunk} from './message';
import {ToolCallMessageChunk, ParsedToolCallMessageChunk, isFileEditToolCallChunk} from './tool';

export function isParsedToolCallChunk(chunk: MessageViewChunk): chunk is ParsedToolCallMessageChunk {
    return chunk.type === 'parsedToolCall';
}

export function chunkToString(chunk: MessageViewChunk) {
    switch (chunk.type) {
        case 'reasoning':
            // Although reasoning content is mapped to a `<think>` tag,
            // actually all messages omit reasoning chunks when serializing to string,
            // we expect this branch to be unreachable
            return `<think>${chunk.content}</think}`;
        case 'text':
            return chunk.content;
        case 'content':
            return `<${chunk.tagName}>${chunk.content}</${chunk.tagName}>`;
        case 'plan':
        case 'toolCall':
        case 'parsedToolCall':
            return chunk.source;
        default:
            assertNever<{type: string}>(chunk, v => `Unknown chunk type ${v.type}`);
    }
}

type MaybeChunk = MessageViewChunk | undefined;

export function assertTaggedChunk(chunk: MaybeChunk, message: string): asserts chunk is TaggedMessageChunk {
    if (chunk?.type !== 'content') {
        throw new Error(message);
    }
}

export function assertPlanChunk(chunk: MaybeChunk, message: string): asserts chunk is PlanMessageChunk {
    if (chunk?.type !== 'plan') {
        throw new Error(message);
    }
}

export function assertToolCallChunk(chunk: MaybeChunk, message: string): asserts chunk is ToolCallMessageChunk {
    if (chunk?.type !== 'toolCall') {
        throw new Error(message);
    }
}

export function isContentfulChunk(chunk: MessageViewChunk) {
    // Remove all thinking and reasoning content
    return (chunk.type !== 'content' || chunk.tagName !== 'thinking') && chunk.type !== 'reasoning';
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

    const toolCall = message.chunks.find(v => v.type === 'parsedToolCall');

    return toolCall && isFileEditToolCallChunk(toolCall)
        ? (toolCall?.executionData ? [toolCall.executionData] : [])
        : [];
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
