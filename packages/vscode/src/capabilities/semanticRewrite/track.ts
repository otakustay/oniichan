import {TextDocumentContentChangeEvent} from 'vscode';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {LineLoadingManager} from '../../ui/lineLoading';
import {TextEditorReference} from '../../utils/editor';
import {Kernel} from '../../kernel';
import {LineWorker} from './worker';

export class LineTrack {
    private readonly workers = new Set<LineWorker>();

    private readonly editorReference: TextEditorReference;

    private readonly loading: LineLoadingManager;

    private readonly kernel: Kernel;

    constructor(uri: string, kernel: Kernel) {
        this.editorReference = new TextEditorReference(uri);
        this.loading = new LineLoadingManager(uri);
        this.kernel = kernel;
    }

    async push(line: number, telemetry: FunctionUsageTelemetry) {
        const editor = this.editorReference.getTextEditor();

        if (!editor) {
            return;
        }

        const worker = new LineWorker(
            editor.document,
            line,
            {loadingManager: this.loading, kernel: this.kernel, telemetry}
        );
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
