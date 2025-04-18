import {assertNever} from '../error';
import type {FileEditData} from '../patch';
import type {TaggedMessageChunk, MessageData, MessageViewChunk} from './message';
import {isFileEditToolCallChunk} from './tool';
import type {ToolCallMessageChunk, ParsedToolCallMessageChunk} from './tool';

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

export function assertToolCallChunk(chunk: MaybeChunk, message: string): asserts chunk is ToolCallMessageChunk {
    if (chunk?.type !== 'toolCall') {
        throw new Error(message);
    }
}

export function isContentfulChunk(chunk: MessageViewChunk) {
    // Remove all thinking and reasoning content
    return (chunk.type !== 'content' || chunk.tagName !== 'thinking') && chunk.type !== 'reasoning';
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
