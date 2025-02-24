import {commands, Disposable, window} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {KernelClient} from '../../kernel';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
}

export class InitializeProjectConfigCommand implements Disposable {
    private readonly command: Disposable;

    private readonly kernel: KernelClient;

    constructor(container: DependencyContainer<Dependency>) {
        this.kernel = container.get(KernelClient);
        this.command = commands.registerCommand(
            'oniichan.initializeProjectConfig',
            async () => {
                try {
                    await this.kernel.call(newUuid(), 'initializeProjectConfig');
                }
                catch {
                    window.showErrorMessage('Oniichan failed to initialize project config in your workspace');
                }
            }
        );
    }

    dispose() {
        this.command.dispose();
    }
}
