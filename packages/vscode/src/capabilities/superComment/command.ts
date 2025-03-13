import path from 'node:path';
import {commands, Range, Position, window, workspace} from 'vscode';
import type {TextEditor, Disposable} from 'vscode';
import type {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import type {InboxSendMessageRequest} from '@oniichan/kernel/protocol';
import {getLanguageConfig} from '@oniichan/shared/language';
import {TaskManager} from '@oniichan/editor-host/utils/task';
import type {TaskContainer} from '@oniichan/editor-host/utils/task';
import {Logger} from '@oniichan/shared/logger';
import {KernelClient} from '../../kernel';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

export class SendToInboxCommand implements Disposable {
    private readonly command: Disposable;

    private readonly kernel: KernelClient;

    constructor(container: DependencyContainer<Dependency>) {
        this.kernel = container.get(KernelClient);
        this.command = commands.registerCommand(
            'oniichan.sendToInbox',
            async () => {
                const taskManager = container.get(TaskManager);
                await taskManager.runTask(newUuid(), container, container => this.execute(container));
            }
        );
    }

    dispose() {
        this.command.dispose();
    }

    private async execute(container: TaskContainer<Dependency>) {
        const logger = container.get(Logger);
        const editor = window.activeTextEditor;

        if (!editor) {
            logger.warn('NoOpenEditor');
            return;
        }

        const context = container.get('TaskContext');
        const relativeFilePath = path.relative(
            workspace.workspaceFolders?.at(0)?.uri.fsPath ?? '',
            editor.document.uri.fsPath
        );
        const messageText = await this.stripOutMessageText(editor, logger);
        const payload: InboxSendMessageRequest = {
            threadUuid: newUuid(),
            uuid: newUuid(),
            body: {
                type: 'text',
                content: messageText,
            },
            references: [
                {
                    type: 'file',
                    file: relativeFilePath,
                    content: editor.document.getText(),
                },
            ],
        };
        logger.trace('SendMessage', payload);
        await this.sendMessage(context.getTaskId(), payload);
        logger.trace('FocusSidebar');
        await commands.executeCommand('oniichan-sidebar.focus');
    }

    private async stripOutMessageText(editor: TextEditor, logger: Logger) {
        const languageConfig = getLanguageConfig(editor.document.languageId);
        const line = editor.selection.active.line;
        const text = languageConfig.stripLineComment(editor.document.lineAt(line).text);

        // We should remove comment before read its text as a file reference
        logger.trace('DeleteComment');
        const isEmptyLineBefore = editor.document.lineAt(line - 1).isEmptyOrWhitespace;
        const isEmptyLineAfter = editor.document.lineAt(line + 1).isEmptyOrWhitespace;
        // Don't leave 2 empty lines
        const deleteLineCount = isEmptyLineBefore || isEmptyLineAfter ? 2 : 1;
        const lineRange = new Range(
            new Position(line, 0),
            new Position(line + deleteLineCount, 0)
        );
        await editor.edit(builder => builder.delete(lineRange));

        return text;
    }

    private async sendMessage(taskId: string, message: InboxSendMessageRequest) {
        try {
            this.kernel.call(taskId, 'inboxSendMessage', message).catch(() => {});
        }
        catch {
            window.showErrorMessage('Oniichan failed to send message to inbox');
        }
    }
}
