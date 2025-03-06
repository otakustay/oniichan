export interface XmlParseTextChunk {
    type: 'text';
    content: string;
}

export interface XmlParseTagStartChunk {
    type: 'tagStart';
    tagName: string;
    source: string;
}

export interface XmlParseTagEndChunk {
    type: 'tagEnd';
    tagName: string;
    source: string;
}

export type XmlParsedChunk = XmlParseTextChunk | XmlParseTagStartChunk | XmlParseTagEndChunk;

type ContextType = 'text' | 'pendingTagStart' | 'tagContent' | 'pendingTagEnd';

// A basic state machine:
//   ┌──────────────────────────────────────────┬─────────────┐
//   │                                          ├─────────┐   │
//   │                                          │         │   │
//   ▼                                          ▼         │   │
// text ──► pendingTagStart ──► tagStart ──► tagContent ──┼───│
//                                              │         │   │
//                                              ▼         │   │
//                                       pendingTagEnd ───┘   │
//                                              │             │
//                                              ▼             │
//                                           tagEnd ──────────┘
export class StreamXmlParser {
    private readonly contextStack: ContextType[] = ['text'];

    private readonly tagStack: string[] = [];

    private buffer = '';

    private inCleanLine = true;

    async *parse(stream: AsyncIterable<string>): AsyncIterable<XmlParsedChunk> {
        for await (const input of stream) {
            for (const char of input) {
                switch (this.currentContextType()) {
                    case 'pendingTagStart':
                        yield* this.yieldInPendingTagStartContext(char);
                        break;
                    case 'tagContent':
                        yield* this.yieldInTagContentContext(char);
                        break;
                    case 'pendingTagEnd':
                        yield* this.yieldInPendingTagEndContext(char);
                        break;
                    default:
                        yield* this.yieldInTextContext(char);
                        break;
                }
                this.checkLineClean(char);
            }
            const contextType = this.currentContextType();
            if (contextType === 'text' || contextType === 'tagContent' && this.buffer) {
                yield {type: 'text', content: this.buffer};
                this.buffer = '';
            }
        }
    }

    private currentContextType() {
        return this.contextStack.at(-1);
    }

    private pushContextType(contextType: ContextType) {
        const current = this.contextStack.at(-1);
        if (contextType !== current) {
            this.contextStack.push(contextType);
        }
    }

    private popContextType() {
        this.contextStack.pop();
    }

    private checkLineClean(char: string) {
        if (char === '\n') {
            this.inCleanLine = true;
            return;
        }

        if (!/\s/.test(char)) {
            this.inCleanLine = false;
        }
    }

    private *yieldInTextContext(char: string): Iterable<XmlParsedChunk> {
        // 1. A `<` at start of line -> pendingTagStart
        if (this.inCleanLine && char === '<') {
            this.pushContextType('pendingTagStart');

            if (this.buffer) {
                yield {type: 'text', content: this.buffer};
            }

            this.buffer = char;
        }
        else {
            this.buffer += char;
        }
    }

    private *yieldInPendingTagStartContext(char: string): Iterable<XmlParsedChunk> {
        // 1. Meet `/` immediately after `<` -> pendingTagEnd
        // 2. Meet `>` -> yield tagStart -> tagContent
        // 3. None identifier character means invalid tag grammar -> back to parent
        this.buffer += char;

        if (this.buffer === '</') {
            this.popContextType();
            this.pushContextType('pendingTagEnd');
            return;
        }

        // DeepSeek R1 has a change to emit double `<` like `<<read_file>`
        if (this.buffer === '<<') {
            return;
        }

        if (/^<{1,2}[^>]+>$/.test(this.buffer)) {
            const tagName = this.buffer.replace(/(^<{1,2})|(>$)/g, '');
            yield {type: 'tagStart', tagName, source: this.buffer};
            this.buffer = '';
            this.tagStack.push(tagName);
            this.pushContextType('tagContent');
            return;
        }

        // This does not strictly satisfy W3C grammar, but enough for most cases
        if (!/[a-zA-Z0-9_-]$/.test(this.buffer)) {
            yield {type: 'text', content: this.buffer};
            this.buffer = '';
            this.popContextType();
            return;
        }
    }

    private *yieldInTagContentContext(char: string): Iterable<XmlParsedChunk> {
        // 1. Meet `<` at start of line -> pendingTagStart (possible child tag)
        // 2. Meet `<` at other position -> pendingTagEnd (possible closing tag)
        if (this.inCleanLine && char === '<') {
            this.pushContextType('pendingTagStart');

            if (this.buffer) {
                yield {type: 'text', content: this.buffer};
            }

            this.buffer = char;
            return;
        }

        if (char === '<') {
            this.pushContextType('pendingTagEnd');

            if (this.buffer) {
                yield {type: 'text', content: this.buffer};
            }

            this.buffer = char;
            return;
        }

        this.buffer += char;
    }

    private *yieldInPendingTagEndContext(char: string): Iterable<XmlParsedChunk> {
        // 1. Meet `>` -> yield tagEnd -> back to parent
        // 2. Line break means invalid tag grammar  -> back to parent
        this.buffer += char;

        if (/<\/[^>]+>/.test(this.buffer)) {
            const tagName = this.buffer.slice(2, -1);
            if (tagName === this.tagStack.at(-1)) {
                yield {type: 'tagEnd', tagName, source: this.buffer};
                this.tagStack.pop();
                this.buffer = '';
                this.popContextType();
                return;
            }
        }

        if (this.buffer.endsWith('\n')) {
            yield {type: 'text', content: this.buffer};
            this.buffer = '';
            this.popContextType();
            return;
        }
    }
}
