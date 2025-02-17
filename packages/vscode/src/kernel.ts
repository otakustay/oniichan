import path from 'node:path';
import {Worker} from 'node:worker_threads';
import {Disposable} from 'vscode';
import {ExecutionMessage, ExecutionNotice, isExecutionMessage, Port} from '@otakustay/ipc';
import {KernelClient as BaseKernelClient} from '@oniichan/kernel/client';
import {EditorHostServer, EditorHostDependency} from '@oniichan/editor-host/server';
import {DependencyContainer} from '@oniichan/shared/container';
import {LogEntry, Logger} from '@oniichan/shared/logger';
import {WebHostClient} from '@oniichan/web-host/client';
import {MessageThreadData} from '@oniichan/shared/inbox';
import {stringifyError} from '@oniichan/shared/error';

class WorkerPort implements Port, Disposable {
    private readonly worker: Worker;

    constructor(worker: Worker) {
        this.worker = worker;
    }

    send(message: ExecutionMessage): void {
        this.worker.postMessage(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.worker.on(
            'message',
            (data: any) => {
                try {
                    if (isExecutionMessage(data)) {
                        callback(data);
                    }
                }
                catch {
                    // Discard incorrect JSON messages
                }
            }
        );
    }

    dispose() {
        this.worker.terminate().catch(() => {});
    }
}

function isDisposable(target: any): target is Disposable {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !!target && typeof target.dispose === 'function';
}

interface Dependency {
    [Logger.containerKey]: Logger;
}

export class KernelClient extends BaseKernelClient implements Disposable {
    static readonly containerKey = 'KernelClient';

    static readonly namespace = BaseKernelClient.namespace;

    // TODO: We need `Client` to expose `port` property directly
    private readonly ownPort: Port;

    private readonly logger: Logger;

    private readonly webClients = new Map<Port, WebHostClient>();

    constructor(port: Port, container: DependencyContainer<Dependency>) {
        super(port);
        this.logger = container.get(Logger).with({source: 'KernelClient'});
        this.ownPort = port;
    }

    addWebPort(port: Port): Disposable {
        const client = new WebHostClient(port);
        this.webClients.set(port, client);
        return new Disposable(() => this.removeWebPort(port));
    }

    removeWebPort(port: Port) {
        this.webClients.delete(port);
    }

    private broadcast(fn: (client: WebHostClient) => Promise<void>) {
        const clients = [...this.webClients.values()];
        void (async () => {
            try {
                await Promise.all(clients.map(v => fn(v)));
            }
            catch (ex) {
                this.logger.error('BroadcastWebFail', {reason: stringifyError(ex)});
            }
        })();
    }

    protected handleNotice(notice: ExecutionNotice): void {
        if (notice.action === 'log') {
            const entry = notice.payload as LogEntry;
            this.logger.print(entry);
        }
        else if (notice.action === 'updateInboxThreadList') {
            const list: MessageThreadData[] = notice.payload;
            this.broadcast(v => v.call(notice.taskId, 'updateThreadList', list));
        }
    }

    dispose() {
        if (isDisposable(this.ownPort)) {
            this.ownPort.dispose();
        }
    }
}

// By now we run kernel in a worker thread in the same process as VSCode extension,
// to run it in a separate process, use a `ChildProcessPort` and modify `kernelEntry.ts` to use a `ProcessPort`.
//
// Also maybe we need to implement a `LspPort` to allow kernel be aware to LSP, this is a breif code:
//
// ```ts
// import {Readable, Writable} from 'node:stream';
// import {Port, ExecutionMessage} from '@otakustay/ipc';
// import {
//     createConnection,
//     Connection,
//     StreamMessageReader,
//     StreamMessageWriter,
// } from 'vscode-languageserver/node';
//
// const LANGUAGE_SERVER_GENERIC_METHOD = 'genericExec';
//
// export class LanguageServerPort implements Port {
//     private readonly connection: Connection;
//
//     private readonly listeners = new Set<(message: any) => void>();
//
//     constructor(readable: Readable, writable: Writable) {
//         this.connection = createConnection(
//             new StreamMessageReader(readable),
//             new StreamMessageWriter(writable)
//         );
//         this.connection.onRequest(
//             LANGUAGE_SERVER_GENERIC_METHOD,
//             (message: ExecutionMessage) => {
//                 for (const listener of this.listeners) {
//                     listener(message);
//                 }
//             }
//         );
//         this.connection.listen();
//     }
//
//     send(message: ExecutionMessage) {
//         this.connection.sendRequest(LANGUAGE_SERVER_GENERIC_METHOD, message).catch(() => {});
//     }
//
//     listen(callback: (message: ExecutionMessage) => void): void {
//         this.listeners.add(callback);
//     }
// }
// ```

export async function createKernelClient(container: DependencyContainer<EditorHostDependency>): Promise<KernelClient> {
    const logger = container.get(Logger).with({source: 'Kernel'});
    logger.trace('ActivateKernelStart');
    const worker = new Worker(path.join(__dirname, 'kernelEntry.js'));
    const port = new WorkerPort(worker);
    const hostServer = new EditorHostServer(container);
    await hostServer.connect(port);
    const kernelClient = new KernelClient(port, container);
    logger.trace('ActivateKernelFinish', {mode: 'thread', threadId: worker.threadId});
    return kernelClient;
}
