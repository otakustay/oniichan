import {window, TextEditor, Position, Uri, workspace, Disposable, Range} from 'vscode';
import {TaskManager, TaskContainer, TaskContext} from '@oniichan/editor-host/utils/task';
import {ScaffoldRequest} from '@oniichan/kernel/protocol';
import {Logger} from '@oniichan/shared/logger';
import {getLanguageConfig} from '@oniichan/shared/language';
import {TextEditorReference} from '@oniichan/editor-host/utils/editor';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {stringifyError} from '@oniichan/shared/string';
import {FunctionUsageResult, FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {KernelClient} from '../../kernel';

const LOADING_TEXT = 'Oniichan正在为你生成脚手架，请不要操作或关闭文件，删除本行可以中止任务';

interface Dependency {
    [Logger.containerKey]: Logger;
    [LoadingManager.containerKey]: LoadingManager;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

interface Provide extends Dependency {
    Telemetry: FunctionUsageTelemetry;
}

export class ScaffoldExecutor {
    private readonly container: TaskContainer<Provide>;

    private abortSignal: AbortSignal | null = null;

    private stage: 'context' | 'loading' | 'import' | 'definition' | 'finish' = 'context';

    constructor(container: TaskContainer<Dependency>) {
        const logger = container.get(Logger);
        const context = container.get(TaskContext);
        const loggerOverride = {
            source: this.constructor.name,
            taskId: context.getTaskId(),
            functionName: 'Scaffold',
        };
        this.container = container
            .bind(Logger, () => logger.with(loggerOverride), {singleton: true})
            .bind('Telemetry', () => new FunctionUsageTelemetry(context.getTaskId(), 'Scaffold'), {singleton: true});
    }

    async executeCommand() {
        const telemetry = this.container.get('Telemetry');
        await telemetry.spyRun(() => this.executeScaffold());
    }

    private async executeScaffold(): Promise<FunctionUsageResult> {
        const logger = this.container.get(Logger);
        logger.trace('Start', {trigger: 'command'});
        const editor = window.activeTextEditor;

        if (!editor) {
            logger.info('Abort', {reason: 'Editor not open'});
            return {
                type: 'abort',
                reason: 'Editor not open',
            };
        }

        try {
            return await this.executeKernel(editor);
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
            return {
                type: 'fail',
                reason: stringifyError(ex),
            };
        }
    }

    private async executeKernel(editor: TextEditor): Promise<FunctionUsageResult> {
        const relative = this.toRelative(editor.document.uri);
        const request: ScaffoldRequest = {
            documentUri: editor.document.uri.toString(),
            workspaceRoot: relative.root,
        };
        const kernel = this.container.get(KernelClient);
        const context = this.container.get(TaskContext);
        const telementry = this.container.get('Telemetry');
        const editorReference = new TextEditorReference(editor.document.uri.toString());

        for await (const entry of kernel.callStreaming(context.getTaskId(), 'scaffold', request)) {
            switch (entry.type) {
                case 'telemetryData':
                    telementry.setTelemetryData(entry.key, entry.value);
                    break;
                case 'loading':
                    this.stage = 'loading';
                    await this.showLoading(editorReference);
                    break;
                case 'abort':
                    this.stage = 'finish';
                    window.showInformationMessage(`We aborted scaffold generation due to this: ${entry.reason}`);
                    return {
                        type: 'abort',
                        reason: entry.reason,
                    };
                case 'code':
                    await this.writeCode(editor, entry.section, entry.code);
                    break;
            }
        }

        return {
            type: 'success',
        };
    }

    private toRelative(documentUri: Uri) {
        for (const folder of workspace.workspaceFolders ?? []) {
            if (documentUri.fsPath.startsWith(folder.uri.fsPath)) {
                return {
                    root: folder.uri.fsPath,
                    path: workspace.asRelativePath(documentUri, false),
                };
            }
        }
        return {
            root: '',
            path: documentUri.fsPath,
        };
    }

    private async showLoading(editorReference: TextEditorReference) {
        const editor = editorReference.getTextEditor();

        if (!editor) {
            return;
        }

        const language = getLanguageConfig(editor.document.languageId);
        const loadingComment = language.toSingleLineComment(LOADING_TEXT);
        await editor.edit(
            builder => builder.insert(new Position(0, 0), loadingComment + '\n'),
            {undoStopAfter: false, undoStopBefore: true}
        );

        const loadingManager = this.container.get(LoadingManager);
        const disposable = loadingManager.add(editorReference.getDocumentUri(), 0);
        this.abortSignal = disposable.signal;
        disposable.signal.addEventListener(
            'abort',
            () => this.removeLoadingText(editorReference)
        );
        const dispose = () => {
            disposable.dispose();
            this.removeLoadingText(editorReference);
        };
        const context = this.container.get(TaskContext);
        context.addDisposable(new Disposable(dispose));
    }

    private removeLoadingText(editorReference: TextEditorReference) {
        const editor = editorReference.getTextEditor();

        if (!editor) {
            return;
        }

        if (editor.document.lineAt(0).text.includes(LOADING_TEXT)) {
            editor.edit(
                builder => builder.delete(new Range(new Position(0, 0), new Position(1, 0))),
                {undoStopAfter: true, undoStopBefore: false}
            );
        }
    }

    private async writeCode(editor: TextEditor, section: 'import' | 'definition', code: string) {
        const logger = this.container.get(Logger);

        if (this.abortSignal?.aborted) {
            logger.trace('AbortWriteCode', {section, code});
            return;
        }

        const changeStage = this.stage !== section;
        const prefix = changeStage && section === 'definition' ? '\n\n' : '';
        const undoStop = changeStage && this.stage !== 'loading';
        logger.trace('WriteCode', {section, prefix, code, undoStop});
        await editor.edit(
            builder => builder.insert(new Position(Infinity, Infinity), prefix + code),
            {
                undoStopBefore: undoStop,
                undoStopAfter: false,
            }
        );
        this.stage = section;
    }
}
