import {Position} from 'vscode';
import type {TextEditor} from 'vscode';
import {Logger} from '@oniichan/shared/logger';

export async function* trim(iterable: AsyncIterable<string>): AsyncIterable<string> {
    const state = {
        buffer: '',
        // Whether there is already some none-whitespace characters flushed
        started: false,
    };

    for await (const chunk of iterable) {
        state.buffer += chunk;

        if (state.buffer.trim()) {
            continue;
        }

        const content = state.buffer.trimEnd();
        yield state.started ? content : content.trimStart();
        state.buffer = state.buffer.slice(content.length);
        state.started = true;
    }
}

export class ScaffoldCodeWriter {
    private state: 'loading' | 'import' | 'definition' = 'loading';

    private buffer = '';

    private readonly editor: TextEditor;

    private readonly logger: Logger;

    constructor(editor: TextEditor, logger: Logger) {
        this.editor = editor;
        this.logger = logger.with({source: 'ScaffoldCodeWriter'});
    }

    async write(section: 'import' | 'definition', code: string) {
        const changeState = this.state !== section;
        const undoStop = changeState && this.state !== 'loading';

        if (changeState) {
            this.buffer = '';
        }

        const trimmed = this.trimCode(code);
        // When import section is written and definition section starts,
        // we'd like to leave a blank line between these 2 sections,
        // however the first chunk of definition section can also include leading line breaks,
        // here we `trimStart()` the chunk and manually append two line breaks
        const codeToWrite = changeState && section === 'definition'
            ? '\n\n' + trimmed.trimStart()
            : trimmed;
        this.logger.trace('WriteCode', {section, undoStop, code: codeToWrite});
        await this.editor.edit(
            builder => builder.insert(new Position(Infinity, Infinity), codeToWrite),
            {
                undoStopBefore: undoStop,
                undoStopAfter: false,
            }
        );
        this.state = section;
    }

    private trimCode(code: string) {
        this.buffer += code;

        if (!this.buffer.trim()) {
            return '';
        }

        const head = this.buffer.trimEnd();
        const codeToWrite = this.state === 'loading' ? head.trimStart() : head;
        this.buffer = this.buffer.slice(head.length);
        return codeToWrite;
    }
}
