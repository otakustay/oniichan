import path from 'node:path';
import {Worker} from 'node:worker_threads';
import {Client, ClientInit, ExecutionMessage, ExecutionNotice, isExecutionMessage, Port} from '@otakustay/ipc';
import {Protocol as KernelProtocol} from '@oniichan/kernel';
import {HostServer, HostServerDependency} from '@oniichan/editor-host/server';
import {DependencyContainer} from '@oniichan/shared/container';
import {LogEntry, Logger} from '@oniichan/shared/logger';
import {MessageThread} from '@oniichan/shared/inbox';
import {Protocol as WebProtocol} from '@oniichan/web-host';
import {stringifyError} from '@oniichan/shared/string';

class WorkerPort implements Port {
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
}

interface Dependency {
    [Logger.containerKey]: Logger;
}

export class KernelClient extends Client<KernelProtocol> {
    static readonly containerKey = 'KernelClient';

    private readonly logger: Logger;

    private readonly webClients = new Map<Port, Client<WebProtocol>>();

    constructor(port: Port, container: DependencyContainer<Dependency>, init?: ClientInit) {
        super(port, {namespace: '-> kernel', ...init});
        this.logger = container.get(Logger);
    }

    addWebPort(port: Port) {
        const client = new Client<WebProtocol>(port, {namespace: '-> web'});
        this.webClients.set(port, client);
    }

    removeWebPort(port: Port) {
        this.webClients.delete(port);
    }

    private broadcast(fn: (client: Client<WebProtocol>) => Promise<void>) {
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
            const list: MessageThread[] = notice.payload;
            this.broadcast(v => v.call(notice.taskId, 'updateThreadList', list));
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

export async function createKernelClient(container: DependencyContainer<HostServerDependency>): Promise<KernelClient> {
    const logger = container.get(Logger);
    logger.trace('ActivateKernelStart');
    const worker = new Worker(path.join(__dirname, 'kernelEntry.js'));
    const port = new WorkerPort(worker);
    const hostServer = new HostServer(container);
    await hostServer.connect(port);
    const kernelClient = new KernelClient(port, container);
    logger.trace('ActivateKernelFinish', {mode: 'thread', threadId: worker.threadId});
    return kernelClient;
}
