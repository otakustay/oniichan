import {window, TextEditor, Range, DecorationRenderOptions, Position, OverviewRulerLane, ThemeColor} from 'vscode';

const decorationOptions: DecorationRenderOptions = {
    overviewRulerColor: new ThemeColor('editorOverviewRuler.infoForeground'),
    overviewRulerLane: OverviewRulerLane.Right,
    color: new ThemeColor('editorInfo.foreground'),
};

const decorationType = window.createTextEditorDecorationType(decorationOptions);

interface LoadingState {
    index: number;
    highlightRange: number;
    lineLength: number;
}

export class LineLoadingManager {
    private readonly lineLoadingState = new Map<number, LoadingState>();

    private readonly editor: TextEditor;

    private timer: ReturnType<typeof setInterval> | null = null;

    constructor(editor: TextEditor) {
        this.editor = editor;
    }

    add(line: number) {
        const lineText = this.editor.document.lineAt(line).text;
        this.lineLoadingState.set(
            line,
            {
                index: 0,
                lineLength: lineText.length,
                highlightRange: Math.floor(lineText.length / 3),
            }
        );
        this.update();
    }

    remove(line: number) {
        this.lineLoadingState.delete(line);
        this.update();
    }

    move(from: number, to: number) {
        const state = this.lineLoadingState.get(from);

        if (state) {
            this.lineLoadingState.delete(from);
            this.lineLoadingState.set(to, state);
        }

        this.update();
    }

    private startAnimation() {
        if (!this.timer) {
            this.timer = setTimeout(() => this.updateLoadingState(), 40);
        }
    }

    private stopAnimation() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private update() {
        if (this.lineLoadingState.size) {
            this.startAnimation();
        }
        else {
            this.stopAnimation();
            this.updateLoadingState();
        }
    }

    private updateLoadingState() {
        const ranges: Range[] = [];

        for (const [line, state] of this.lineLoadingState) {
            const start = state.index;
            const end = Math.min(state.lineLength, start + state.highlightRange);
            const range = new Range(new Position(line, start), new Position(line, end));
            state.index = (state.index + 1) % (state.lineLength - 1);
            ranges.push(range);
        }

        this.editor.setDecorations(decorationType, ranges);

        if (this.timer) {
            this.timer = setTimeout(() => this.updateLoadingState(), 40);
        }
    }
}
