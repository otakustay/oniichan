import {Disposable, commands, languages} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {KernelClient} from '../../kernel';
import {TaskManager} from '@oniichan/host/utils/task';
import {ScaffoldLoadingCodeLensProvider} from './loading';
import {ScaffoldExecutor} from './executor';

export interface Dependency {
    [Logger.containerKey]: Logger;
    [KernelClient.containerKey]: KernelClient;
    [TaskManager.containerKey]: TaskManager;
}

interface Provide extends Dependency {
    [ScaffoldLoadingCodeLensProvider.containerKey]: ScaffoldLoadingCodeLensProvider;
}

export class ScaffoldCommand implements Disposable {
    private readonly disposables: Disposable[] = [];

    private readonly container: DependencyContainer<Provide>;

    constructor(container: DependencyContainer<Dependency>) {
        this.container = container
            .bind(ScaffoldLoadingCodeLensProvider, () => new ScaffoldLoadingCodeLensProvider(), {singleton: true});
        const command = commands.registerCommand(
            'oniichan.scaffold',
            async () => {
                const executor = new ScaffoldExecutor(this.container);
                await executor.executeCommand();
            }
        );
        const loading = languages.registerCodeLensProvider(
            {scheme: 'file'},
            this.container.get(ScaffoldLoadingCodeLensProvider)
        );
        this.disposables.push(command, loading);
    }

    dispose() {
        Disposable.from(...this.disposables).dispose();
    }
}
