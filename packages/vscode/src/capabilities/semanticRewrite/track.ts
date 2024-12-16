import {TextDocumentContentChangeEvent} from 'vscode';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {DependencyContainer} from '@oniichan/shared/container';
import {TextEditorReference} from '@oniichan/host/utils/editor';
import {LoadingManager} from '@oniichan/host/ui/loading';
import {KernelClient} from '../../kernel';
import {LineWorker} from './worker';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
    [LoadingManager.containerKey]: LoadingManager;
}

export class LineTrack {
    private readonly workers = new Set<LineWorker>();

    private readonly editorReference: TextEditorReference;

    private readonly container: DependencyContainer<Dependency>;

    constructor(uri: string, container: DependencyContainer<Dependency>) {
        this.editorReference = new TextEditorReference(uri);
        this.container = container;
    }

    async push(line: number, telemetry: FunctionUsageTelemetry) {
        const editor = this.editorReference.getTextEditor();

        if (!editor) {
            return;
        }

        const container = this.container.bind('Telemetry', () => telemetry);
        const worker = new LineWorker(
            editor.document,
            line,
            container
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
