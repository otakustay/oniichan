import type {Disposable, ExtensionContext} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';
import {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {TaskManager} from '@oniichan/editor-host/utils/task';
import {ResourceManager} from '@oniichan/editor-host/utils/resource';
import type {ResourceManagerDependency} from '@oniichan/editor-host/utils/resource';
import {ExportInboxCommand, OpenDataFolderCommand} from './capabilities/debug/index.js';
import {OutputChannelProvider, OutputLogger} from './capabilities/logger/index.js';
import {ScaffoldCommand} from './capabilities/scaffold/index.js';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite/index.js';
import {WebApp, WebConnection} from './capabilities/web/index.js';
import {WorkspaceTracker} from './capabilities/tracker/index.js';
import {InitializeProjectConfigCommand, OmdCompletion} from './capabilities/config/index.js';
import {SuperComment} from './capabilities/superComment/index.js';
import {startKernel} from './kernel/index.js';
import {migrate} from './migration/index.js';

class VscodeExtensionResourceManager extends ResourceManager {
    private readonly extensionContext: ExtensionContext;

    constructor(container: DependencyContainer<ResourceManagerDependency>, extensionContext: ExtensionContext) {
        super(container);
        this.extensionContext = extensionContext;
    }

    addResource(resource: Disposable): void {
        this.extensionContext.subscriptions.push(resource);
    }

    removeResource(resource: Disposable): void {
        const index = this.extensionContext.subscriptions.indexOf(resource);

        if (index >= 0) {
            this.extensionContext.subscriptions.splice(index, 1);
        }
    }

    dispose(): void {
    }
}

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
        .bind(ResourceManager, () => new VscodeExtensionResourceManager(loggerContainer, context), {singleton: true})
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
        new ExportInboxCommand(globalContainer),
        new InitializeProjectConfigCommand(globalContainer),
        new OmdCompletion(globalContainer),
        new SuperComment(globalContainer)
    );
    const logger = globalContainer.get(Logger);
    logger.trace('ExtensionActivated');
}

export function deactivate() {
}
