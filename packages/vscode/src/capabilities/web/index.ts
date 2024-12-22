import path from 'node:path';
import fs from 'node:fs/promises';
import {
    commands,
    Disposable,
    ExtensionContext,
    StatusBarAlignment,
    StatusBarItem,
    Uri,
    ViewColumn,
    Webview,
    window,
} from 'vscode';
import {ExecutionMessage, Port, isExecutionMessage} from '@otakustay/ipc';
import {WebAppServer, IpcServer} from '@oniichan/server';
import {DependencyContainer} from '@oniichan/shared/container';

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
    ExtensionContext: ExtensionContext;
}

export class WebApp implements Disposable {
    private readonly container: DependencyContainer<Dependency>;

    // File is `dist/extension.ts`, reference to `dist/web`
    private readonly webAppServer = new WebAppServer({staticDirectory: path.join(__dirname, 'web')});

    private readonly statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        this.container = container;
        this.initializeStatusBar();
        this.initializeWebAppServer();
        this.initializeOpenWebAppCommand();
        this.initializeOpenWebviewCommand();
    }

    dispose() {
        Disposable.from(...this.disposables).dispose();
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
                const htmlUri = Uri.joinPath(context.extensionUri, 'dist', 'web', 'index.html');
                const entryScriptUri = Uri.joinPath(context.extensionUri, 'dist', 'web', 'main.js');
                const htmlContent = await fs.readFile(htmlUri.fsPath, 'utf-8');
                const html = htmlContent.replace('main.js', panel.webview.asWebviewUri(entryScriptUri).toString());
                panel.webview.html = html;
                const port = new WebviewPort(panel.webview);
                const ipcServer = new IpcServer({namespace: 'web -> server'});
                await ipcServer.connect(port);
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
        this.webAppServer.on('port', port => this.updateStatusBar(port));
        this.webAppServer.on('error', reason => console.error(`Server encounted an error: ${reason}`));
        this.webAppServer.start().catch(() => {});
        this.disposables.push(new Disposable(() => this.webAppServer.close().catch(() => {})));
    }

    private updateStatusBar(port: number | null) {
        this.statusBarItem.text = `Oniichan $(${port ? 'dashboard' : 'error'})`;
        this.statusBarItem.show();
    }
}
