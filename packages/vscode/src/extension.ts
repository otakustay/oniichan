import {ExtensionContext} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {LoadingManager} from '@oniichan/host/ui/loading';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebApp} from './capabilities/web';
import {createKernelClient, KernelClient} from './kernel';

export async function activate(context: ExtensionContext) {
    const serverHostContainer = new DependencyContainer()
        .bind(LoadingManager, () => new LoadingManager(), {singleton: true})
        .bind('ExtensionContext', () => context, {singleton: true});
    const kernel = await createKernelClient(serverHostContainer);
    const globalContainer = serverHostContainer
        .bind(KernelClient, () => kernel, {singleton: true});

    context.subscriptions.push(
        new SemanticRewriteCommand(globalContainer),
        new OpenDataFolderCommand(),
        new WebApp(globalContainer)
    );
}

export function deactivate() {
}
