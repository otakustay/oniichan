import {StreamXmlParser, XmlParseTagEndChunk, XmlParseTagStartChunk, XmlParseTextChunk} from '../string';
import {isToolName, ToolName} from '../tool';

interface TextChunk {
    type: 'text';
    content: string;
}

interface ThinkingStartChunk {
    type: 'thinkingStart';
    source: string;
}

interface ThinkingDeltaChunk {
    type: 'thinkingDelta';
    source: string;
}

interface ThinkingEndChunk {
    type: 'thinkingEnd';
    source: string;
}

interface TextInToolChunk {
    type: 'textInTool';
    source: string;
}

interface ToolStartChunk {
    type: 'toolStart';
    toolName: ToolName;
    source: string;
}

interface ToolDeltaChunk {
    type: 'toolDelta';
    arguments: Record<string, string>;
    source: string;
}

interface ToolEndChunk {
    type: 'toolEnd';
    source: string;
}

export type ToolParsedChunk =
    | TextChunk
    | ThinkingStartChunk
    | ThinkingDeltaChunk
    | ThinkingEndChunk
    | TextInToolChunk
    | ToolStartChunk
    | ToolDeltaChunk
    | ToolEndChunk;

const THINKING_TAGS = ['thinking'];

function isThinkingTag(tag: string | undefined) {
    return !!tag && THINKING_TAGS.includes(tag);
}

export class StreamingToolParser {
    private tagStack: string[] = [];

    async *parse(stream: AsyncIterable<string>): AsyncIterable<ToolParsedChunk> {
        const parser = new StreamXmlParser();
        for await (const chunk of parser.parse(stream)) {
            switch (chunk.type) {
                case 'text':
                    yield* this.yieldForTextChunk(chunk);
                    break;
                case 'tagStart':
                    yield* this.yieldForTagStart(chunk);
                    break;
                case 'tagEnd':
                    yield* this.yieldForTagEnd(chunk);
                    break;
            }
        }
    }

    *yieldForTextChunk(chunk: XmlParseTextChunk): Iterable<ToolParsedChunk> {
        const activeTag = this.tagStack.at(-1);
        // `<thinking>` tag has plain text inside it
        if (isThinkingTag(activeTag)) {
            yield {type: 'thinkingDelta', source: chunk.content};
        }
        // We don't allow text content in top level tag, all tool calls contains only parameters
        else if (activeTag) {
            if (this.tagStack.length > 1) {
                yield {type: 'toolDelta', arguments: {[activeTag]: chunk.content}, source: chunk.content};
            }
            else {
                yield {type: 'textInTool', source: chunk.content};
            }
        }
        else {
            yield {type: 'text', content: chunk.content};
        }
    }

    *yieldForTagStart(chunk: XmlParseTagStartChunk): Iterable<ToolParsedChunk> {
        const activeTag = this.tagStack.at(-1);
        if (isThinkingTag(activeTag)) {
            yield {type: 'thinkingDelta', source: chunk.source};
        }
        else if (activeTag) {
            // We're already in a tool call, a tool call allow one level of nested tag to be parameters
            if (this.tagStack.length === 1) {
                this.tagStack.push(chunk.tagName);
                yield {type: 'toolDelta', arguments: {[chunk.tagName]: ''}, source: chunk.source};
            }
            // Further nested tags are just a part of parameter's value
            else {
                yield {type: 'toolDelta', arguments: {[activeTag]: chunk.source}, source: chunk.source};
            }
        }
        else if (isThinkingTag(chunk.tagName)) {
            this.tagStack.push(chunk.tagName);
            yield {type: 'thinkingStart', source: chunk.source};
        }
        else if (isToolName(chunk.tagName)) {
            this.tagStack.push(chunk.tagName);
            yield {type: 'toolStart', toolName: chunk.tagName, source: chunk.source};
        }
        else {
            yield {type: 'text', content: chunk.source};
        }
    }

    *yieldForTagEnd(chunk: XmlParseTagEndChunk): Iterable<ToolParsedChunk> {
        if (!this.tagStack.length) {
            yield {type: 'text', content: chunk.source};
            return;
        }

        // TODO: This is wrong when `</thinking>` inside `<think>`
        if (isThinkingTag(this.tagStack.at(-1))) {
            if (isThinkingTag(chunk.tagName)) {
                yield {type: 'thinkingEnd', source: chunk.source};
                this.tagStack.pop();
            }
            else {
                yield {type: 'thinkingDelta', source: chunk.source};
            }
            return;
        }

        // Not a matching tag, treat as text
        if (chunk.tagName !== this.tagStack.at(-1)) {
            yield* this.yieldForTextChunk({type: 'text', content: chunk.source});
            return;
        }

        this.tagStack.pop();

        if (!this.tagStack.length) {
            yield {type: 'toolEnd', source: chunk.source};
        }
        else {
            yield {type: 'toolDelta', arguments: {}, source: chunk.source};
        }
    }
}
