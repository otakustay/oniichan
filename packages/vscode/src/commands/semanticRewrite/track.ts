import {TextDocumentContentChangeEvent} from 'vscode';
import {LineLoadingManager} from '../../ui/lineLoading';
import {LineWorker} from './worker';
import {TextEditorReference} from '../../utils/editor';

export class LineTrack {
    private readonly workers = new Set<LineWorker>();

    private readonly editorReference: TextEditorReference;

    private readonly loading: LineLoadingManager;

    constructor(uri: string) {
        this.editorReference = new TextEditorReference(uri);
        this.loading = new LineLoadingManager(uri);
    }

    async push(line: number) {
        const editor = this.editorReference.getTextEditor();

        if (!editor) {
            return;
        }

        const worker = new LineWorker(editor.document, line, this.loading);
        this.workers.add(worker);
        await worker.run().catch(() => {});
        this.workers.delete(worker);
    }

    updateTrack(changes: readonly TextDocumentContentChangeEvent[]) {
        for (const change of changes) {
            for (const worker of this.workers) {
                worker.applyUserEdit(change.range, change.text);
            }
        }
    }
}
