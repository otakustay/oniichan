import {TextEditor, TextDocumentContentChangeEvent} from 'vscode';
import {LineLoadingManager} from '../../ui/lineLoading';
import {LineWorker} from './worker';

export class LineTrack {
    private readonly workers = new Set<LineWorker>();

    private readonly editor: TextEditor;

    private readonly loading: LineLoadingManager;

    constructor(editor: TextEditor) {
        this.editor = editor;
        this.loading = new LineLoadingManager(editor);
    }

    async push(line: number) {
        const worker = new LineWorker(line, this.editor, this.loading);
        this.workers.add(worker);
        await worker.run().catch(() => {});
        this.workers.delete(worker);
    }

    updateTrack(changes: readonly TextDocumentContentChangeEvent[]) {
        for (const change of changes) {
            for (const worker of this.workers) {
                worker.applyEdit(change.range, change.text);
            }
        }
    }
}
