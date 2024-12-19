import {window, TextEditor, Position, Uri, workspace, Disposable, Range} from 'vscode';
import {TaskManager, TaskContainer, TaskContext} from '@oniichan/host/utils/task';
import {ScaffoldRequest} from '@oniichan/kernel';
import {Logger} from '@oniichan/shared/logger';
import {getLanguageConfig} from '@oniichan/shared/language';
import {TextEditorReference} from '@oniichan/host/utils/editor';
import {LoadingManager} from '@oniichan/host/ui/loading';
import {KernelClient} from '../../kernel';

const LOADING_TEXT = 'Oniichan正在为你生成脚手架，请不要操作或关闭文件';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [LoadingManager.containerKey]: LoadingManager;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

export class ScaffoldExecutor {
    private readonly container: TaskContainer<Dependency>;

    constructor(container: TaskContainer<Dependency>) {
        const logger = container.get(Logger);
        const context = container.get(TaskContext);
        const loggerOverride = {
            source: this.constructor.name,
            taskId: context.getTaskId(),
            functionName: 'Scaffold',
        };
        this.container = container
            .bind(Logger, () => logger.with(loggerOverride), {singleton: true});
    }

    async executeCommand() {
        const logger = this.container.get(Logger);
        logger.trace('Start', {trigger: 'command'});
        const editor = window.activeTextEditor;

        if (!editor) {
            logger.info('Abort', {reason: 'Editor not open'});
            return;
        }

        await this.executeKernel(editor);
    }

    private async executeKernel(editor: TextEditor) {
        const relative = this.toRelative(editor.document.uri);
        const request: ScaffoldRequest = {
            documentUri: editor.document.uri.toString(),
            workspaceRoot: relative.root,
        };
        const kernel = this.container.get(KernelClient);
        const context = this.container.get(TaskContext);
        const editorReference = new TextEditorReference(editor.document.uri.toString());

        for await (const entry of kernel.callStreaming(context.getTaskId(), 'scaffold', request)) {
            switch (entry.type) {
                case 'loading':
                    await this.showLoading(editorReference);
                    break;
                case 'abort':
                    window.showInformationMessage(`We aborted scaffold generation due to this: ${entry.reason}`);
                    return;
                case 'importSection':
                    await editor.edit(builder => builder.insert(new Position(Infinity, 0), entry.code));
                    break;
                case 'definitionSection':
                    await editor.edit(builder => builder.insert(new Position(Infinity, 0), '\n\n' + entry.code));
                    break;
            }
        }
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
        await editor.edit(builder => builder.insert(new Position(0, 0), loadingComment + '\n'));

        const loadingManager = this.container.get(LoadingManager);
        const disposable = loadingManager.add(editorReference.getDocumentUri(), 0);
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
            editor.edit(builder => builder.delete(new Range(new Position(0, 0), new Position(1, 0))));
        }
    }
}
