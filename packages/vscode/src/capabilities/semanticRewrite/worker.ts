import {Range, TextDocument} from 'vscode';
import {LinePin} from '@otakustay/text-pin';
import {stringifyError} from '@oniichan/shared/string';
import {FunctionUsageResult, FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {isComment} from '@oniichan/shared/language';
import semanticRewriteApi from '../../api/semanticRewrite';
import {LineLoadingManager} from '../../ui/lineLoading';
import {TextEditorReference} from '../../utils/editor';

interface TextPosition {
    line: number;
    character: number;
}

interface TextRange {
    start: TextPosition;
    end: TextPosition;
}

export interface LineWorkerHelper {
    loadingManager: LineLoadingManager;
    telemetry: FunctionUsageTelemetry;
}

export class LineWorker {
    private line: number;

    private readonly hint: string;

    private readonly pin: LinePin;

    private readonly telemetry: FunctionUsageTelemetry;

    private readonly editorReference: TextEditorReference;

    private readonly loadingManager: LineLoadingManager;

    constructor(document: TextDocument, line: number, helper: LineWorkerHelper) {
        this.line = line;
        this.editorReference = new TextEditorReference(document.uri.toString());
        this.hint = document.lineAt(line).text;
        this.pin = new LinePin(line, this.hint.length);
        this.loadingManager = helper.loadingManager;
        this.telemetry = helper.telemetry;
        this.telemetry.setTelemetryData('inputHint', this.hint);
    }

    async run() {
        await this.telemetry.spyRun(() => this.runRewrite());
    }

    private async runRewrite(): Promise<FunctionUsageResult> {
        const hint = this.hint.trim();
        const editor = this.editorReference.getTextEditor();

        if (!editor) {
            return {type: 'abort', reason: 'Editor not opened'};
        }

        const document = editor.document;

        if (!hint || isComment(hint, document.languageId)) {
            return {type: 'abort', reason: 'Current line is empty or comment'};
        }

        const codeBefore = document.getText(new Range(0, 0, this.line, 0));
        const codeAfter = document.getText(new Range(this.line + 1, 0, Infinity, Infinity));
        this.telemetry.setTelemetryData('inputCodeBefore', codeBefore);
        this.telemetry.setTelemetryData('inputCodeAfter', codeAfter);

        this.showLoading();

        try {
            const code = await semanticRewriteApi.rewrite(
                {file: document.fileName, codeBefore, codeAfter, hint},
                this.telemetry
            );
            this.telemetry.setTelemetryData('outputCode', code);
            // Do not pass `editor` down, it is possible that editor is switched while the request is running
            const result = await this.applyRewrite(code, hint);
            return result;
        }
        catch (ex) {
            throw new Error(`Semantic rewrite failed: ${stringifyError(ex)}`, {cause: ex});
        }
        finally {
            this.hideLoading();
        }
    }

    private async applyRewrite(code: string, hint: string): Promise<FunctionUsageResult> {
        if (code.trim() === hint || this.pin.isBroken()) {
            return {type: 'abort', reason: 'Trigger hint has beed overriden'};
        }

        const range = new Range(this.line, 0, this.line, Number.MAX_SAFE_INTEGER);
        const codeTrimmed = code.replaceAll(/^\n+|\n+$/g, '');
        await this.editorReference.applyReplacementEdit(range, codeTrimmed);
        return {type: 'success'};
        // Format range doesn't seem to work
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

    applyUserEdit(range: TextRange, text: string) {
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
