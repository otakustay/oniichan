import {window, Range, Position, OverviewRulerLane, ThemeColor, Disposable, workspace} from 'vscode';
import type {DecorationRenderOptions, TextDocumentChangeEvent} from 'vscode';
import {LinePin} from '@otakustay/text-pin';
import {TextEditorReference} from '../utils/editor';
import {DisposableAbortSignal} from '../utils/task';

const decorationOptions: DecorationRenderOptions = {
    overviewRulerColor: new ThemeColor('editorOverviewRuler.infoForeground'),
    overviewRulerLane: OverviewRulerLane.Right,
    color: new ThemeColor('editorInfo.foreground'),
};

const decorationType = window.createTextEditorDecorationType(decorationOptions);

interface LoadingState {
    pin: LinePin;
    index: number;
    highlightRange: number;
    lineLength: number;
    controller: AbortController;
}

export class LoadingManager implements Disposable {
    static readonly containerKey = 'LoadingManager';

    private readonly state = new Map<string, Set<LoadingState>>();

    private readonly disposables: Disposable[] = [];

    private timer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        const change = workspace.onDidChangeTextDocument(event => this.updateLoadingStateOnTextChange(event));
        this.disposables.push(change);
    }

    add(documentUri: string, line: number | LinePin): DisposableAbortSignal {
        const editorReference = new TextEditorReference(documentUri);
        const editor = editorReference.getTextEditorWhenActive();

        if (!editor) {
            return new DisposableAbortSignal(AbortSignal.abort(), () => {});
        }

        const map = this.getStateSet(editor.document.uri.toString());
        const lineText = editor.document.lineAt(typeof line === 'number' ? line : line.getPinLineNumber()).text;
        const state: LoadingState = {
            pin: typeof line === 'number' ? new LinePin(line, lineText.length) : line,
            index: 0,
            lineLength: lineText.length,
            highlightRange: Math.floor(lineText.length / 3),
            controller: new AbortController(),
        };
        map.add(state);

        this.startAnimation();
        return new DisposableAbortSignal(state.controller.signal, () => this.delete(documentUri, state));
    }

    remove(documentUri: string, line: number) {
        const set = this.state.get(documentUri);

        if (!set) {
            return;
        }

        for (const state of set) {
            if (state.pin.getPinLineNumber() === line) {
                this.delete(documentUri, state);
            }
        }

        this.update();
    }

    dispose() {
        for (const stateSet of this.state.values()) {
            for (const state of stateSet) {
                state.controller.abort();
            }
        }
        this.state.clear();
        this.stopAnimation();

        Disposable.from(...this.disposables).dispose();
    }

    private delete(documentUri: string, state: LoadingState) {
        const set = this.state.get(documentUri);
        if (!set) {
            return;
        }
        const deleted = set.delete(state);
        if (deleted) {
            state.controller.abort();
        }
    }

    private getStateSet(documentUri: string): Set<LoadingState> {
        const stateSet = this.state.get(documentUri) ?? new Set();
        this.state.set(documentUri, stateSet);
        return stateSet;
    }

    private isEmpty() {
        for (const stateMap of this.state.values()) {
            if (stateMap.size) {
                return false;
            }
        }

        return true;
    }

    private startAnimation() {
        if (!this.timer) {
            this.timer = setTimeout(() => this.updateLoadingStateOnAnimation(), 40);
        }
    }

    private stopAnimation() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private update() {
        if (this.isEmpty()) {
            this.stopAnimation();
            this.updateLoadingStateOnAnimation();
        }
        else {
            this.startAnimation();
        }
    }

    private updateLoadingStateOnAnimation() {
        const ranges: Range[] = [];

        for (const [uri, stateSet] of this.state.entries()) {
            const editor = new TextEditorReference(uri).getTextEditorWhenActive();

            if (!editor) {
                continue;
            }

            for (const state of stateSet) {
                const start = state.index;
                const line = state.pin.getPinLineNumber();
                const end = Math.min(state.lineLength, start + state.highlightRange);
                const range = new Range(new Position(line, start), new Position(line, end));
                state.index = (state.index + 1) % (state.lineLength - 1);
                ranges.push(range);
            }

            editor.setDecorations(decorationType, ranges);
        }

        if (this.timer) {
            this.timer = setTimeout(() => this.updateLoadingStateOnAnimation(), 40);
        }
    }

    private updateLoadingStateOnTextChange(event: TextDocumentChangeEvent) {
        const uri = event.document.uri.toString();
        const stateSet = this.state.get(uri);

        if (!stateSet) {
            return;
        }

        const broken: LoadingState[] = [];
        for (const state of stateSet) {
            for (const change of event.contentChanges) {
                state.pin.edit(change.range, change.text);
                if (state.pin.isBroken()) {
                    broken.push(state);
                }
            }
        }
        for (const value of broken) {
            this.delete(uri, value);
        }
        this.update();
    }
}
