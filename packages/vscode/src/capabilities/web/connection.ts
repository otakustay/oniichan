import {Disposable} from 'vscode';
import {Port} from '@otakustay/ipc';
import {stringifyError} from '@oniichan/shared/error';
import {WebHostClient} from '@oniichan/web-host/client';
import {Logger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';

interface Dependency {
    [Logger.containerKey]: Logger;
}

/**
 * Manages all ports connected to web applications, including sidebar webview and standalone pages in browser.
 */
export class WebConnection {
    static readonly containerKey = 'WebConnection';

    private readonly clients = new Map<Port, WebHostClient>();

    private readonly logger: Logger;

    constructor(container: DependencyContainer<Dependency>) {
        this.logger = container.get(Logger).with({source: 'WebConnection'});
    }

    addWebPort(port: Port): Disposable {
        const client = new WebHostClient(port);
        this.clients.set(port, client);
        return new Disposable(() => this.removeWebPort(port));
    }

    broadcast(fn: (client: WebHostClient) => Promise<void>) {
        const clients = [...this.clients.values()];
        void (async () => {
            try {
                await Promise.all(clients.map(v => fn(v)));
            }
            catch (ex) {
                this.logger.error('BroadcastWebFail', {reason: stringifyError(ex)});
            }
        })();
    }

    private removeWebPort(port: Port) {
        this.clients.delete(port);
    }
}
