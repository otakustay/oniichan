import {ExtensionContext} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '@oniichan/host/ui/loading';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebApp} from './capabilities/web';
import {createKernelClient, KernelClient} from './kernel';
import {OutputChannelProvider, OutputLogger} from './capabilities/logger';

export async function activate(context: ExtensionContext) {
    const outputContainer = new DependencyContainer()
        .bind(OutputChannelProvider, () => new OutputChannelProvider(), {singleton: true});
    const serverHostContainer = outputContainer
        .bind(Logger, () => new OutputLogger(outputContainer, 'Extension'), {singleton: true})
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
    const logger = globalContainer.get(Logger);
    logger.trace('ExtensionActivated');
}

export function deactivate() {
}
