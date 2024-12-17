import path from 'node:path';
import {Worker} from 'node:worker_threads';
import {Protocol as KernelProtocol} from '@oniichan/kernel';
import {HostServer, HostServerDependency} from '@oniichan/host/server';
import {Client, ExecutionMessage, ExecutionNotice, isExecutionMessage, Port} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {LogEntry, Logger} from '@oniichan/shared/logger';

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

export class KernelClient extends Client<KernelProtocol> {
    static readonly containerKey = 'KernelClient';

    protected handleNotice(notice: ExecutionNotice): void {
        if (notice.action === 'log') {
            const entry = notice.payload as LogEntry;
            switch (entry.level) {
                case 'error':
                    console.log(entry);
                    break;
                case 'warn':
                    console.warn(entry);
                    break;
                default:
                    console.log(entry);
                    break;
            }
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
    const worker = new Worker(path.join(__dirname, 'kernelEntry.js'), {stdout: true, stderr: true});
    const port = new WorkerPort(worker);
    const hostServer = new HostServer(container);
    await hostServer.connect(port);
    const kernelClient = new KernelClient(port);
    logger.trace('ActivateKernelFinish', {mode: 'thread', threadId: worker.threadId});
    return kernelClient;
}
