import {window, Disposable, commands, workspace} from 'vscode';
import type {TextEditor, TextDocumentChangeEvent} from 'vscode';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {getLanguageConfig} from '@oniichan/shared/language';
import {newUuid} from '@oniichan/shared/id';
import {DependencyContainer} from '@oniichan/shared/container';
import {getSemanticRewriteConfiguration} from '@oniichan/editor-host/utils/config';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {TaskContext, TaskManager} from '@oniichan/editor-host/utils/task';
import {KernelClient} from '../../kernel';
import {LineWorker} from './worker';

function isNewLineOnly(event: TextDocumentChangeEvent): boolean {
    const changedText = event.contentChanges.at(-1)?.text ?? '';
    return /^\s*\n\s*$/.test(changedText);
}

interface Dependency {
    [Logger.containerKey]: Logger;
    [KernelClient.containerKey]: KernelClient;
    [LoadingManager.containerKey]: LoadingManager;
    [TaskManager.containerKey]: TaskManager;
}

class SemanticRewriteExecutor {
    private readonly taskId = newUuid();

    private readonly tracks: Map<string, Set<LineWorker>>;

    private readonly container: DependencyContainer<Dependency>;

    constructor(tracks: Map<string, Set<LineWorker>>, container: DependencyContainer<Dependency>) {
        this.tracks = tracks;
        const logger = container.get(Logger);
        const loggerOverride = {
            source: 'SemanticRewriteExecutor',
            taskId: this.taskId,
            functionName: 'SemanticRewrite',
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

        await this.executeSemanticRewrite(editor, 'command');
    }

    async executeDocumentChange(event: TextDocumentChangeEvent) {
        if (!event.contentChanges.length) {
            return;
        }

        if (getSemanticRewriteConfiguration().triggerType !== 'Automatic') {
            return;
        }

        if (event.document !== window.activeTextEditor?.document) {
            return;
        }

        if (!isNewLineOnly(event)) {
            return;
        }

        const logger = this.container.get(Logger);
        logger.trace('Start', {trigger: 'automatic'});

        if (!this.isContextSuitableForAutomaticTrigger(window.activeTextEditor)) {
            return;
        }

        await this.executeSemanticRewrite(window.activeTextEditor, 'automatic');
    }

    private isContextSuitableForAutomaticTrigger(editor: TextEditor) {
        const logger = this.container.get(Logger);

        if (editor.document.lineCount > 400) {
            logger.info('Abort', {reason: 'Document has too many lines'});
            return false;
        }

        for (let i = 0; i < editor.document.lineCount; i++) {
            const line = editor.document.lineAt(i);
            if (line.range.end.character > 300) {
                logger.info('Abort', {reason: 'One line has too many characters'});
                return false;
            }
        }

        const hint = editor.document.lineAt(editor.selection.active.line).text;
        const language = getLanguageConfig(editor.document.languageId);

        if (language.isComment(hint)) {
            logger.info('Abort', {reason: 'Hint is a comment'});
            return false;
        }

        if (!language.endsWithIdentifier(hint)) {
            logger.info('Abort', {reason: 'Hint does not end with an identifier'});
            return false;
        }

        if (language.includesKeywordOnly(hint)) {
            logger.info('Abort', {reason: 'Hint contains only keywords'});
            return false;
        }

        return true;
    }

    private async startWorker(editor: TextEditor, line: number, telemetry: FunctionUsageTelemetry) {
        const taskManager = this.container.get(TaskManager);
        await taskManager.runTask(
            telemetry.getUuid(),
            this.container,
            async taskContainer => {
                const container = taskContainer.bind('Telemetry', () => telemetry);
                const worker = new LineWorker(
                    editor.document,
                    line,
                    container
                );

                const uri = editor.document.uri.toString();
                const workers = this.tracks.get(uri) ?? new Set();
                this.tracks.set(uri, workers);

                workers.add(worker);
                const context = taskContainer.get(TaskContext);
                context.addDisposable(new Disposable(() => workers.delete(worker)));

                await worker.run();
            }
        );
    }

    private async executeSemanticRewrite(editor: TextEditor, trigger: string) {
        const telemetry = new FunctionUsageTelemetry(this.taskId, 'SemanticRewrite', {trigger});
        telemetry.setTelemetryData('trigger', trigger);
        await this.startWorker(editor, editor.selection.active.line, telemetry);
    }
}

export class SemanticRewriteCommand extends Disposable {
    private readonly disopsable: Disposable;

    private readonly tracks = new Map<string, Set<LineWorker>>();

    private readonly container: DependencyContainer<Dependency>;

    constructor(container: DependencyContainer<Dependency>) {
        super(() => void this.disopsable.dispose());

        this.container = container;
        this.disopsable = Disposable.from(
            commands.registerCommand(
                'oniichan.semanticRewrite',
                async () => {
                    const executor = new SemanticRewriteExecutor(this.tracks, this.container);
                    await executor.executeCommand();
                }
            ),
            workspace.onDidChangeTextDocument(
                async event => {
                    const executor = new SemanticRewriteExecutor(this.tracks, this.container);
                    await executor.executeDocumentChange(event);
                }
            )
        );
    }
}
