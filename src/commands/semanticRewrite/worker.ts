import {TextEditor, Range} from 'vscode';
import {LinePin} from '@otakustay/text-pin';
import semanticRewriteApi from '../../api/semanticRewrite';
import {isComment} from '../../utils/language';
import {LineLoadingManager} from '../../ui/lineLoading';

interface TextPosition {
    line: number;
    character: number;
}

interface TextRange {
    start: TextPosition;
    end: TextPosition;
}

export class LineWorker {
    private line: number;

    private readonly hint: string;

    private readonly pin: LinePin;

    private readonly editor: TextEditor;

    private readonly loadingManager: LineLoadingManager;

    constructor(line: number, editor: TextEditor, loadingManager: LineLoadingManager) {
        this.line = line;
        this.hint = editor.document.lineAt(line).text;
        this.pin = new LinePin(line, this.hint.length);
        this.editor = editor;
        this.loadingManager = loadingManager;
    }

    async run() {
        const hint = this.hint.trim();

        if (!hint || isComment(hint, this.editor.document.languageId)) {
            return;
        }

        const codeBefore = this.editor.document.getText(new Range(0, 0, this.line - 1, Infinity));
        const codeAfter = this.editor.document.getText(new Range(this.line + 1, 0, Infinity, Infinity));

        this.showLoading();

        try {
            const code = await semanticRewriteApi.rewrite(this.editor.document.fileName, codeBefore, codeAfter, hint);

            if (code.trim() !== hint && !this.pin.isBroken()) {
                const range = new Range(this.line, 0, this.line, Infinity);
                const codeTrimmed = code.replaceAll(/^\n+|\n+$/g, '');
                await this.editor.edit(builder => builder.replace(range, codeTrimmed));
                // const editSuccessful = await this.editor.edit(builder => builder.replace(range, codeTrimmed));
                // if (editSuccessful) {
                //     const lines = codeTrimmed.split('\n');
                //     const startLine = this.pin.getPinLineNumber();
                //     const endLine = startLine + lines.length;
                //     await commands.executeCommand(
                //         'vscode.executeFormatRangeProvider',
                //         this.editor.document.uri,
                //         new Range(startLine, 0, endLine, 0)
                //     );
                // }
            }
        }
        catch (ex) {
            throw new Error(`Semantic rewrite failed: ${ex instanceof Error ? ex.message : ex}`)
        }
        finally {
            this.hideLoading();
        }
    }

    applyEdit(range: TextRange, text: string) {
        const currentLineNumber = this.pin.getPinLineNumber();
        this.pin.edit(range, text);

        if (this.pin.isBroken()) {
            this.hideLoading();
            this.loadingManager.remove(this.line);
        }
        else {
            const toLineNumber = this.pin.getPinLineNumber();
            this.loadingManager.move(currentLineNumber, toLineNumber);
            this.line = toLineNumber;
        }
    }

    showLoading() {
        this.loadingManager.add(this.line);
    }

    hideLoading() {
        this.loadingManager.remove(this.line);
    }
}
