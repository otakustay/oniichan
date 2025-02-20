import {ExtensionContext} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';
import {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {TaskManager} from '@oniichan/editor-host/utils/task';
import {ExportInboxCommand, OpenDataFolderCommand} from './capabilities/debug';
import {OutputChannelProvider, OutputLogger} from './capabilities/logger';
import {ScaffoldCommand} from './capabilities/scaffold';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {WebApp, WebConnection} from './capabilities/web';
import {WorkspaceTracker} from './capabilities/tracker';
import {startKernel} from './kernel';
import {migrate} from './migration';

export async function activate(context: ExtensionContext) {
    void migrate();

    const baseContainer = new DependencyContainer()
        .bind(OutputChannelProvider, () => new OutputChannelProvider(), {singleton: true})
        .bind(TaskManager, () => new TaskManager(), {singleton: true});
    const loggerContainer = baseContainer
        .bind(Logger, () => new OutputLogger(baseContainer, 'Extension'), {singleton: true});
    const serverHostContainer = loggerContainer
        .bind(WorkspaceFileStructure, () => new WorkspaceFileStructure(), {singleton: true})
        .bind(WebConnection, () => new WebConnection(loggerContainer), {singleton: true})
        .bind(LoadingManager, () => new LoadingManager(), {singleton: true})
        .bind(DiffViewManager, () => new DiffViewManager(loggerContainer), {singleton: true})
        .bind('ExtensionContext', () => context, {singleton: true});
    const workspaceTracker = new WorkspaceTracker(serverHostContainer);
    const kernel = await startKernel(serverHostContainer);
    const globalContainer = serverHostContainer.bind('KernelClient', () => kernel.getClient());

    context.subscriptions.push(
        kernel,
        workspaceTracker,
        new SemanticRewriteCommand(globalContainer),
        new OpenDataFolderCommand(),
        new WebApp(globalContainer),
        new ScaffoldCommand(globalContainer),
        new ExportInboxCommand(globalContainer)
    );
    const logger = globalContainer.get(Logger);
    logger.trace('ExtensionActivated');
}

export function deactivate() {
}
