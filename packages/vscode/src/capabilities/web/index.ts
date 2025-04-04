import path from 'node:path';
import fs from 'node:fs/promises';
import {commands, Disposable, StatusBarAlignment, Uri, ViewColumn, window} from 'vscode';
import type {WebviewViewProvider, ExtensionContext, StatusBarItem, Webview, WebviewView} from 'vscode';
import {isExecutionMessage} from '@otakustay/ipc';
import type {ExecutionMessage, Port} from '@otakustay/ipc';
import type {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import {wait, waitCondition} from '@oniichan/shared/promise';
import {WebHostClient} from '@oniichan/web-host/client';
import type {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {newUuid} from '@oniichan/shared/id';
import type {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import type {WorkspaceFileStructure} from '@oniichan/shared/dir';
import type {KernelClient} from '../../kernel';
import {WebAppServer} from './server';
import {establishIpc} from './ipc';
import {WebConnection} from './connection';

export {WebConnection};

class WebviewPort implements Port, Disposable {
    private readonly webview: Webview;

    private readonly disposables: Disposable[] = [];

    private readonly waitWebReady: () => Promise<void>;

    constructor(webview: Webview) {
        this.webview = webview;
        this.waitWebReady = () => {
            const executor = (resolve: () => void) => {
                webview.onDidReceiveMessage(e => console.log('message', e));
                webview.onDidReceiveMessage(e => e === 'WebReady' && resolve());
            };
            // We believe there is a chance that web won't send "WebReady" to IDE,
            // but the message channel is also available in this condition,
            // so we suppose it is ready after 1 second
            return Promise.race([new Promise<void>(executor), wait(1000)]);
        };
    }

    send(message: ExecutionMessage): void {
        void this.waitWebReady().then(() => this.webview.postMessage(message));
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
    [WebConnection.containerKey]: WebConnection;
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
    ExtensionContext: ExtensionContext;
}

export class WebApp implements Disposable, WebviewViewProvider {
    private readonly container: DependencyContainer<Dependency>;

    private sidebarClient: WebHostClient | null = null;

    private readonly assetUri: Uri;

    private readonly webAppServer;

    private readonly statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        const logger = container.get(Logger);
        this.container = container
            .bind(Logger, () => logger.with({source: 'WebApp'}), {singleton: true});
        // File is `dist/extension.ts`, reference to `dist/web`, this always works in production mode
        this.webAppServer = new WebAppServer(this.container, {staticDirectory: path.join(__dirname, 'web')});
        const context = this.container.get('ExtensionContext');
        this.assetUri = Uri.joinPath(
            context.extensionUri,
            'dist',
            process.env.NODE_ENV === 'development' ? 'web-dev' : 'web'
        );

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

        const htmlUri = Uri.joinPath(this.assetUri, 'index.html');
        const entryScriptUri = Uri.joinPath(this.assetUri, 'main.js');
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
                await waitCondition(() => !!this.sidebarClient, {interval: 50, timeout: 2000});
                await this.sidebarClient?.call(newUuid(), 'composeNewMessage');
            }
        );
        this.disposables.push(view, openCommand, composeCommand);
    }

    private initializeOpenWebviewCommand() {
        const openWebviewCommand = commands.registerCommand(
            'oniichan.openWebview',
            async () => {
                const panel = window.createWebviewPanel(
                    'oniichan',
                    'Oniichan Here',
                    ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [this.assetUri],
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
