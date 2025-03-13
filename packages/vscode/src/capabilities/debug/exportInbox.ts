import {commands, Disposable, window, workspace} from 'vscode';
import type {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {KernelClient} from '../../kernel';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
}

export class ExportInboxCommand extends Disposable {
    private readonly disopsable: Disposable;

    private readonly kernel: KernelClient;

    constructor(container: DependencyContainer<Dependency>) {
        super(() => void this.disopsable.dispose());

        this.kernel = container.get(KernelClient);
        this.disopsable = commands.registerCommand(
            'oniichan.exportInbox',
            async () => {
                const data = await this.kernel.call(newUuid(), 'debugExportInbox');
                const options = {
                    language: 'json',
                    content: JSON.stringify(data, null, 2),
                };
                const document = await workspace.openTextDocument(options);
                await window.showTextDocument(document);
            }
        );
    }
}
