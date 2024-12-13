import {ExtensionContext} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {LoadingManager} from './ui/loading';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebApp} from './capabilities/web';
import {createKernelClient, KernelClient} from './kernel';

export async function activate(context: ExtensionContext) {
    const kernel = await createKernelClient();
    const globalContainer = new DependencyContainer()
        .bind(LoadingManager, () => new LoadingManager(), {singleton: true})
        .bind(KernelClient, () => kernel, {singleton: true})
        .bind('ExtensionContext', () => context, {singleton: true});

    context.subscriptions.push(
        new SemanticRewriteCommand(globalContainer),
        new OpenDataFolderCommand(),
        new WebApp(globalContainer)
    );
}

export function deactivate() {
}
