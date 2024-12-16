import {window, Range, DecorationRenderOptions, Position, OverviewRulerLane, ThemeColor} from 'vscode';
import {TextEditorReference} from '../utils/editor';

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

export class LoadingManager {
    static readonly containerKey = 'LoadingManager';

    private readonly state = new Map<string, Map<number, LoadingState>>();

    private timer: ReturnType<typeof setInterval> | null = null;

    add(documentUri: string, line: number) {
        const editorReference = new TextEditorReference(documentUri);
        const editor = editorReference.getTextEditorWhenActive();

        if (!editor) {
            return;
        }

        const map = this.getStateMap(editor.document.uri.toString());
        const lineText = editor.document.lineAt(line).text;
        const state: LoadingState = {
            index: 0,
            lineLength: lineText.length,
            highlightRange: Math.floor(lineText.length / 3),
        };
        map.set(line, state);

        this.startAnimation();
    }

    remove(documentUri: string, line: number) {
        const map = this.getStateMap(documentUri);
        map.delete(line);

        this.update();
    }

    move(documentUri: string, from: number, to: number) {
        const map = this.getStateMap(documentUri);
        const state = map.get(from);

        if (state) {
            map.delete(from);
            map.set(to, state);
        }

        this.update();
    }

    private getStateMap(documentUri: string): Map<number, LoadingState> {
        let stateMap = this.state.get(documentUri);
        if (!stateMap) {
            stateMap = new Map();
            this.state.set(documentUri, stateMap);
        }
        return stateMap;
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
        if (this.isEmpty()) {
            this.stopAnimation();
            this.updateLoadingState();
        }
        else {
            this.startAnimation();
        }
    }

    private updateLoadingState() {
        const ranges: Range[] = [];

        for (const [uri, stateMap] of this.state.entries()) {
            const editor = new TextEditorReference(uri).getTextEditorWhenActive();

            if (!editor) {
                continue;
            }

            for (const [line, state] of stateMap.entries()) {
                const start = state.index;
                const end = Math.min(state.lineLength, start + state.highlightRange);
                const range = new Range(new Position(line, start), new Position(line, end));
                state.index = (state.index + 1) % (state.lineLength - 1);
                ranges.push(range);
            }

            editor.setDecorations(decorationType, ranges);
        }

        if (this.timer) {
            this.timer = setTimeout(() => this.updateLoadingState(), 40);
        }
    }
}
