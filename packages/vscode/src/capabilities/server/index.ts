import path from 'node:path';
import {commands, Disposable, StatusBarAlignment, StatusBarItem, window} from 'vscode';
import {Server} from '@oniichan/server';

const OPEN_WEB_APP_COMMAND = 'oniichan.openWebAppInExternalBrowser';

export class WebAppServer extends Disposable {
    // File is `dist/extension.ts`, reference to `dist/web`
    private readonly server = new Server({staticDirectory: path.join(__dirname, 'web')});

    private readonly disposable: Disposable;

    private readonly statusBarItem: StatusBarItem;

    constructor() {
        super(() => void this.disposable.dispose());

        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
        this.statusBarItem.command = OPEN_WEB_APP_COMMAND;
        this.updateStatusBar(null);
        this.server.on('port', port => this.updateStatusBar(port));
        this.server.on('error', reason => console.error(`Server encounted an error: ${reason}`));
        this.server.start().catch(() => {});

        this.disposable = Disposable.from(
            {dispose: () => this.server.close().catch(() => {})},
            this.statusBarItem,
            commands.registerCommand(
                OPEN_WEB_APP_COMMAND,
                async () => {
                    const {default: open} = await import('open');
                    if (this.server.port) {
                        await open(`http://127.0.0.1:${this.server.port}`);
                    }
                }
            )
        );
    }

    updateStatusBar(port: number | null) {
        this.statusBarItem.text = `Oniichan $(${port ? 'dashboard' : 'error'})`;
        this.statusBarItem.show();
    }

    dispose() {
        this.server.close().catch(() => {});
        this.statusBarItem.dispose();
    }
}
