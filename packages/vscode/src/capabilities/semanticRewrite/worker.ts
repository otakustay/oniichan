import {Range, TextDocument} from 'vscode';
import {LinePin} from '@otakustay/text-pin';
import {FunctionUsageResult, FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {SemanticRewriteRequest} from '@oniichan/kernel/protocol';
import {DependencyContainer} from '@oniichan/shared/container';
import {TextEditorReference} from '@oniichan/editor-host/utils/editor';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {Logger} from '@oniichan/shared/logger';
import {TaskContext} from '@oniichan/editor-host/utils/task';
import {KernelClient} from '../../kernel';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [TaskContext.containerKey]: TaskContext;
    Telemetry: FunctionUsageTelemetry;
}

export class LineWorker {
    private readonly hint: string;

    private readonly pin: LinePin;

    private readonly editorReference: TextEditorReference;

    private readonly container: DependencyContainer<Dependency>;

    private signal: AbortSignal | null = null;

    constructor(document: TextDocument, line: number, container: DependencyContainer<Dependency>) {
        this.editorReference = new TextEditorReference(document.uri.toString());
        this.hint = document.lineAt(line).text;
        this.pin = new LinePin(line, this.hint.length);
        this.container = container;
    }

    async run() {
        const telemetry = this.container.get('Telemetry');
        await telemetry.spyRun(() => this.runRewrite());
    }

    private async runRewrite(): Promise<FunctionUsageResult> {
        const logger = this.container.get(Logger);
        const editor = this.editorReference.getTextEditor();
        const telemetry = this.container.get('Telemetry');
        const hint = this.hint.trim();
        telemetry.setTelemetryData('inputHint', hint);

        logger.info(
            'Run',
            {
                documentUri: this.editorReference.getDocumentUri(),
                line: this.pin.getPinLineNumber(),
                hint,
            }
        );

        if (!editor) {
            logger.info('Abort', {reason: 'Editor not opened'});
            return {type: 'abort', reason: 'Editor not opened'};
        }

        const document = editor.document;
        const request: SemanticRewriteRequest = {
            documentUri: document.uri.toString(),
            file: document.fileName,
            line: this.pin.getPinLineNumber(),
        };
        const kernel = this.container.get(KernelClient);
        for await (const entry of kernel.callStreaming(telemetry.getUuid(), 'semanticRewrite', request)) {
            switch (entry.type) {
                case 'loading':
                    this.showLoading();
                    break;
                case 'telemetryData':
                    telemetry.setTelemetryData(entry.key, entry.value);
                    break;
                case 'abort':
                    return {type: 'abort', reason: entry.reason};
                case 'result':
                    return await this.applyRewrite(entry.code, hint);
            }
        }

        logger.error('Fail', {reason: 'No result form kernel'});
        throw new Error('No result form kernel');
    }

    private showLoading() {
        const loadingManager = this.container.get(LoadingManager);
        const taskContext = this.container.get(TaskContext);
        const disposable = loadingManager.add(this.editorReference.getDocumentUri(), this.pin);
        this.signal = disposable.signal;
        taskContext.addDisposable(disposable);
    }

    private async applyRewrite(code: string, hint: string): Promise<FunctionUsageResult> {
        const logger = this.container.get(Logger);

        if (code.trim() === hint) {
            logger.info('Abort', {reason: 'Suggestion exactly matches trigger hint'});
            return {type: 'abort', reason: 'Suggestion exactly matches trigger hint'};
        }

        if (this.signal?.aborted) {
            logger.info('Abort', {reason: 'Trigger hint has beed overriden'});
            return {type: 'abort', reason: 'Trigger hint has beed overriden'};
        }

        const line = this.pin.getPinLineNumber();
        const range = new Range(line, 0, line, Number.MAX_SAFE_INTEGER);
        const codeTrimmed = code.replaceAll(/^\n+|\n+$/g, '');
        await this.editorReference.applyReplacementEdit(range, codeTrimmed, true);
        logger.info('Apply', {line, code: codeTrimmed});
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
}
