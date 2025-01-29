import {StreamXmlParser, XmlParseTagEndChunk, XmlParseTagStartChunk, XmlParseTextChunk} from '../string';
import {isToolName, ToolName} from '../tool';

interface TextChunk {
    type: 'text';
    content: string;
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

export type ToolParsedChunk = TextChunk | TextInToolChunk | ToolStartChunk | ToolDeltaChunk | ToolEndChunk;

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
        // We don't allow text content in top level tag, all tool calls contains only parameters
        if (activeTag) {
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
        if (activeTag) {
            // We're already in a tool call, a tag start means a start of parameter, just push a parameter name
            this.tagStack.push(chunk.tagName);
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

        this.tagStack.pop();
        if (!this.tagStack.length) {
            yield {type: 'toolEnd', source: chunk.source};
        }
    }
}
