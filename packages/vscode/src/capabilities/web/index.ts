import path from 'node:path';
import fs from 'node:fs/promises';
import {
    commands,
    WebviewViewProvider,
    Disposable,
    ExtensionContext,
    StatusBarAlignment,
    StatusBarItem,
    Uri,
    ViewColumn,
    Webview,
    window,
    WebviewView,
} from 'vscode';
import {ExecutionMessage, Port, isExecutionMessage} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {WebHostClient} from '@oniichan/web-host/client';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {newUuid} from '@oniichan/shared/id';
import {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import {KernelClient} from '../../kernel';
import {WebAppServer} from './server';
import {establishIpc} from './ipc';

class WebviewPort implements Port, Disposable {
    private readonly webview: Webview;

    private readonly disposables: Disposable[] = [];

    constructor(webview: Webview) {
        this.webview = webview;
    }

    send(message: ExecutionMessage): void {
        this.webview.postMessage(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        const listener = (message: any) => {
            if (isExecutionMessage(message)) {
                callback(message);
            }
        };
        const disposable = this.webview.onDidReceiveMessage(listener);
        this.disposables.push(disposable);
    }

    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

const OPEN_WEB_APP_COMMAND = 'oniichan.openWebAppInExternalBrowser';

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    ExtensionContext: ExtensionContext;
}

export class WebApp implements Disposable, WebviewViewProvider {
    private readonly container: DependencyContainer<Dependency>;

    private sidebarClient: WebHostClient | null = null;

    // File is `dist/extension.ts`, reference to `dist/web`
    private readonly webAppServer;

    private readonly statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        this.container = container;
        this.webAppServer = new WebAppServer(this.container, {staticDirectory: path.join(__dirname, 'web')});
        this.initializeStatusBar();
        this.initializeSidebar();
        this.initializeWebAppServer();
        this.initializeOpenWebAppCommand();
        this.initializeOpenWebviewCommand();
    }

    async resolveWebviewView(view: WebviewView) {
        const port = await this.setupWebview(view.webview);
        this.sidebarClient = new WebHostClient(port);
        this.disposables.push(port);
    }

    dispose() {
        Disposable.from(...this.disposables).dispose();
    }

    private async setupWebview(webview: Webview) {
        const port = new WebviewPort(webview);
        const container = this.container.bind('Port', () => port, {singleton: true});
        await establishIpc(container);

        const context = this.container.get('ExtensionContext');
        const htmlUri = Uri.joinPath(context.extensionUri, 'dist', 'web', 'index.html');
        const entryScriptUri = Uri.joinPath(context.extensionUri, 'dist', 'web', 'main.js');
        const htmlContent = await fs.readFile(htmlUri.fsPath, 'utf-8');
        const html = htmlContent.replace('main.js', webview.asWebviewUri(entryScriptUri).toString());
        webview.options = {
            enableScripts: true,
        };
        webview.html = html;

        return port;
    }

    private initializeSidebar() {
        const view = window.registerWebviewViewProvider(
            'oniichan-sidebar',
            this,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
            }
        );
        const openCommand = commands.registerCommand(
            'oniichan.openSidebar',
            async () => {
                await commands.executeCommand('oniichan-sidebar.focus');
            }
        );
        const composeCommand = commands.registerCommand(
            'oniichan.composeNewMessage',
            async () => {
                await commands.executeCommand('oniichan-sidebar.focus');
                await this.sidebarClient?.call(newUuid(), 'composeNewMessage');
            }
        );
        this.disposables.push(view, openCommand, composeCommand);
    }

    private initializeOpenWebviewCommand() {
        const context = this.container.get('ExtensionContext');
        const openWebviewCommand = commands.registerCommand(
            'oniichan.openWebview',
            async () => {
                const panel = window.createWebviewPanel(
                    'oniichan',
                    'Oniichan Here',
                    ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [Uri.joinPath(context.extensionUri, 'dist', 'web')],
                    }
                );
                const port = await this.setupWebview(panel.webview);
                panel.onDidDispose(() => port.dispose());
            }
        );
        this.disposables.push(openWebviewCommand);
    }

    private initializeOpenWebAppCommand() {
        const openWebAppCommand = commands.registerCommand(
            OPEN_WEB_APP_COMMAND,
            async () => {
                const {default: open} = await import('open');
                if (this.webAppServer.port) {
                    await open(`http://127.0.0.1:${this.webAppServer.port}`);
                }
            }
        );
        this.disposables.push(openWebAppCommand);
    }

    private initializeStatusBar() {
        this.statusBarItem.command = OPEN_WEB_APP_COMMAND;
        this.updateStatusBar(null);
        this.disposables.push(this.statusBarItem);
    }

    private initializeWebAppServer() {
        const logger = this.container.get(Logger);
        this.webAppServer.on('port', port => this.updateStatusBar(port));
        this.webAppServer.on('error', reason => logger.error('WebServerError', {reason}));
        this.webAppServer.start().catch(() => {});
        this.disposables.push(new Disposable(() => this.webAppServer.close().catch(() => {})));
    }

    private updateStatusBar(port: number | null) {
        this.statusBarItem.text = `Oniichan $(${port ? 'dashboard' : 'error'})`;
        this.statusBarItem.show();
    }
}
