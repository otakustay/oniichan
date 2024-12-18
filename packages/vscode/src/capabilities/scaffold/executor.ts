import {window, TextEditor, Position, Uri, workspace} from 'vscode';
import {TaskManager, TaskContainer, TaskContext} from '@oniichan/host/utils/task';
import {ScaffoldRequest} from '@oniichan/kernel';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {KernelClient} from '../../kernel';
import {ScaffoldLoadingCodeLensProvider} from './loading';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
    [ScaffoldLoadingCodeLensProvider.containerKey]: ScaffoldLoadingCodeLensProvider;
}

export class ScaffoldExecutor {
    private readonly taskId = newUuid();

    private readonly container: DependencyContainer<Dependency>;

    constructor(container: DependencyContainer<Dependency>) {
        const logger = container.get(Logger);
        const loggerOverride = {
            source: this.constructor.name,
            taskId: this.taskId,
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

        const taskManager = this.container.get(TaskManager);
        await taskManager.runTask(
            this.taskId,
            this.container,
            async container => {
                logger.trace('Loading');
                const loadingProvider = this.container.get(ScaffoldLoadingCodeLensProvider);
                const disposable = loadingProvider.showLoading(editor.document.uri.toString());
                const context = container.get(TaskContext);
                context.addDisposable(disposable);
                await this.executeKernel(container, editor);
            }
        );
    }

    private async executeKernel(container: TaskContainer<Dependency>, editor: TextEditor) {
        const relative = this.toRelative(editor.document.uri);
        const request: ScaffoldRequest = {
            workspaceRoot: relative.root,
            relativePath: relative.path,
        };
        const kernel = container.get(KernelClient);

        for await (const entry of kernel.callStreaming(this.taskId, 'scaffold', request)) {
            switch (entry.type) {
                case 'abort':
                    window.showInformationMessage(`We aborted scaffold generation due to this: ${entry.reason}`);
                    return;
                case 'importSection':
                    editor.edit(builder => builder.insert(new Position(0, 0), entry.code));
                    break;
                case 'definitionSection':
                    editor.edit(builder => builder.insert(new Position(Infinity, 0), '\n\n' + entry.code));
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
}
