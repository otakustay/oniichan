import {assertNever} from '../error';
import {StreamXmlParser} from '../string';
import type {XmlParseTagEndChunk, XmlParseTagStartChunk, XmlParseTextChunk} from '../string';
import {isToolName} from './definition';
import type {ToolName} from './definition';

interface TextChunk {
    type: 'text';
    content: string;
}

export type ContentTagName = 'thinking';

interface ContentStartChunk {
    type: 'contentStart';
    tagName: ContentTagName;
    source: string;
}

interface ContentDeltaChunk {
    type: 'contentDelta';
    tagName: ContentTagName;
    source: string;
}

interface ContentEndChunk {
    type: 'contentEnd';
    tagName: ContentTagName;
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

interface ToolParameterStartChunk {
    type: 'toolParameterStart';
    parameter: string;
    source: string;
}

interface ToolEndChunk {
    type: 'toolEnd';
    source: string;
}

export type ToolParsedChunk =
    | TextChunk
    | ContentStartChunk
    | ContentDeltaChunk
    | ContentEndChunk
    | TextInToolChunk
    | ToolStartChunk
    | ToolParameterStartChunk
    | ToolDeltaChunk
    | ToolEndChunk;

const CONTENT_TAGS: string[] = ['thinking'] satisfies ContentTagName[];

function isContentTag(tag: string | null): tag is ContentTagName {
    return !!tag && CONTENT_TAGS.includes(tag);
}

interface RootState {
    state: 'root';
}

interface InsideContentState {
    state: 'insideContent';
    tagName: ContentTagName;
}

interface InsideToolState {
    state: 'insideTool';
    toolName: ToolName;
}

interface InsideToolParameterState {
    state: 'insideToolParameter';
    toolName: ToolName;
    parameterName: string;
}

type TagNestingStructure =
    | RootState
    | InsideContentState
    | InsideToolState
    | InsideToolParameterState;

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

    private *yieldForTextChunk(chunk: XmlParseTextChunk): Iterable<ToolParsedChunk> {
        const structure = this.getTagNestingStructure();
        switch (structure.state) {
            case 'root':
                yield {type: 'text', content: chunk.content};
                break;
            case 'insideContent':
                yield {type: 'contentDelta', tagName: structure.tagName, source: chunk.content};
                break;
            case 'insideTool':
                yield {type: 'textInTool', source: chunk.content};
                break;
            case 'insideToolParameter':
                yield {type: 'toolDelta', arguments: {[structure.parameterName]: chunk.content}, source: chunk.content};
                break;
            default:
                assertNever<{state: string}>(structure, v => `Invalid XML tag state ${v.state}`);
        }
    }

    private *yieldForTagStart(chunk: XmlParseTagStartChunk): Iterable<ToolParsedChunk> {
        const structure = this.getTagNestingStructure();
        if (structure.state === 'root') {
            if (isContentTag(chunk.tagName)) {
                yield {type: 'contentStart', tagName: chunk.tagName, source: chunk.source};
                this.tagStack.push(chunk.tagName);
            }
            else if (isToolName(chunk.tagName)) {
                yield {type: 'toolStart', toolName: chunk.tagName, source: chunk.source};
                this.tagStack.push(chunk.tagName);
            }
            else {
                yield {type: 'text', content: chunk.source};
            }
        }
        else if (structure.state === 'insideContent') {
            yield {type: 'contentDelta', tagName: structure.tagName, source: chunk.source};
        }
        else if (structure.state === 'insideTool') {
            yield {type: 'toolParameterStart', parameter: chunk.tagName, source: chunk.source};
            this.tagStack.push(chunk.tagName);
        }
        else if (structure.state === 'insideToolParameter') {
            yield {type: 'toolDelta', arguments: {[structure.parameterName]: chunk.source}, source: chunk.source};
        }
        else {
            assertNever<{state: string}>(structure, v => `Invalid XML tag state ${v.state}`);
        }
    }

    private *yieldForTagEnd(chunk: XmlParseTagEndChunk): Iterable<ToolParsedChunk> {
        const structure = this.getTagNestingStructure();
        if (structure.state === 'root') {
            yield {type: 'text', content: chunk.source};
        }
        else if (structure.state === 'insideContent') {
            if (chunk.tagName === structure.tagName) {
                yield {type: 'contentEnd', tagName: structure.tagName, source: chunk.source};
                this.tagStack.pop();
            }
            else {
                yield {type: 'contentDelta', tagName: structure.tagName, source: chunk.source};
            }
        }
        else if (structure.state === 'insideTool') {
            if (chunk.tagName === structure.toolName) {
                yield {type: 'toolEnd', source: chunk.source};
                this.tagStack.pop();
            }
            else {
                yield {type: 'textInTool', source: chunk.source};
            }
        }
        else if (structure.state === 'insideToolParameter') {
            if (chunk.tagName === structure.parameterName) {
                yield {type: 'toolDelta', arguments: {}, source: chunk.source};
                this.tagStack.pop();
            }
            else {
                yield {type: 'toolDelta', arguments: {[structure.parameterName]: chunk.source}, source: chunk.source};
            }
        }
        else {
            assertNever<{state: string}>(structure, v => `Invalid XML tag state ${v.state}`);
        }
    }

    private getTagNestingStructure(): TagNestingStructure {
        const activeTag = this.tagStack.at(-1) ?? null;
        const parentTag = this.tagStack.at(-2) ?? null;

        if (!activeTag) {
            return {state: 'root'};
        }
        if (isContentTag(activeTag)) {
            return {state: 'insideContent', tagName: activeTag};
        }
        if (parentTag) {
            if (isToolName(parentTag)) {
                return {state: 'insideToolParameter', toolName: parentTag, parameterName: activeTag};
            }
        }
        else if (isToolName(activeTag)) {
            return {state: 'insideTool', toolName: activeTag};
        }

        throw new Error(`Unexpected XML parsing state (${parentTag} > ${activeTag})`);
    }
}
