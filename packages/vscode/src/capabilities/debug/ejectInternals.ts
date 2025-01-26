import {commands, Disposable, Uri, window, workspace} from 'vscode';
import {KernelClient} from '../../kernel';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
}

export class EjectInternalsCommand extends Disposable {
    private readonly disopsable: Disposable;

    private readonly kernel: KernelClient;

    constructor(container: DependencyContainer<Dependency>) {
        super(() => void this.disopsable.dispose());

        this.kernel = container.get(KernelClient);
        this.disopsable = commands.registerCommand(
            'oniichan.ejectInternals',
            async () => {
                try {
                    for await (const file of this.kernel.callStreaming(newUuid(), 'debugEjectInternals')) {
                        const document = await workspace.openTextDocument(Uri.file(file));
                        await window.showTextDocument(document, {preview: false});
                    }
                }
                catch {
                    window.showErrorMessage('无法创建配置目录，可能是~/.config目录没有权限');
                }
            }
        );
    }
}
