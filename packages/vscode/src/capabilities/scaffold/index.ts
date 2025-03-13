import {Disposable, commands} from 'vscode';
import type {DependencyContainer} from '@oniichan/shared/container';
import type {Logger} from '@oniichan/shared/logger';
import {TaskManager} from '@oniichan/editor-host/utils/task';
import type {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {newUuid} from '@oniichan/shared/id';
import type {KernelClient} from '../../kernel';
import {ScaffoldExecutor} from './executor';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [LoadingManager.containerKey]: LoadingManager;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

export class ScaffoldCommand implements Disposable {
    private readonly disposables: Disposable[] = [];

    private readonly container: DependencyContainer<Dependency>;

    constructor(container: DependencyContainer<Dependency>) {
        this.container = container;
        const command = commands.registerCommand(
            'oniichan.scaffold',
            async () => {
                const taskManager = this.container.get(TaskManager);
                await taskManager.runTask(
                    newUuid(),
                    this.container,
                    async container => {
                        const executor = new ScaffoldExecutor(container);
                        await executor.executeCommand();
                    }
                );
            }
        );
        this.disposables.push(command);
    }

    dispose() {
        Disposable.from(...this.disposables).dispose();
    }
}
