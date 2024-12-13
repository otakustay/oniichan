import {Disposable, languages} from 'vscode';
import {TaskManager} from '@oniichan/editor-host/utils/task';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';
import {KernelClient} from '../../kernel';
import {SuperCommentCompletionProvider} from './completion';
import {SendToInboxCommand} from './command';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

export class SuperComment implements Disposable {
    private readonly completionItemProvider: Disposable;

    private readonly sendCommand: Disposable;

    constructor(container: DependencyContainer<Dependency>) {
        this.completionItemProvider = languages.registerCompletionItemProvider(
            [
                'typescript',
                'javascript',
                'typescriptreact',
                'javascriptreact',
            ],
            new SuperCommentCompletionProvider(),
            '`'
        );
        this.sendCommand = new SendToInboxCommand(container);
    }

    dispose() {
        this.completionItemProvider.dispose();
        this.sendCommand.dispose();
    }
}
