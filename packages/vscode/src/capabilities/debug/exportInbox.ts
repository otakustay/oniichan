import {commands, Disposable, window, workspace} from 'vscode';
import {KernelClient} from '../../kernel';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';

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
