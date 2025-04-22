import path from 'node:path';
import {existsSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import type {Disposable} from 'vscode';
import {env, window} from 'vscode';
import {isExecutionMessage} from '@otakustay/ipc';
import type {ExecutionMessage, ExecutionNotice, Port} from '@otakustay/ipc';
import {KernelClient as BaseKernelClient} from '@oniichan/kernel/client';
import {EditorHostServer} from '@oniichan/editor-host/server';
import type {EditorHostDependency} from '@oniichan/editor-host/server';
import type {DependencyContainer} from '@oniichan/shared/container';
import {Logger} from '@oniichan/shared/logger';
import type {LogEntry} from '@oniichan/shared/logger';
import type {MessageThreadData} from '@oniichan/shared/inbox';
import {stringifyError} from '@oniichan/shared/error';
import {WebConnection} from '../capabilities/web';

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

function getBinaryDirectory() {
    const tries = [
        path.join(env.appRoot, 'node_modules', '@vscode', 'ripgrep', 'bin'),
        path.join(env.appRoot, 'node_modules', 'vscode-ripgrep', 'bin'),
        path.join(env.appRoot, 'node_modules.asar.unpacked', '@vscode', 'ripgrep', 'bin'),
        path.join(env.appRoot, 'node_modules.asar.unpacked', 'vscode-ripgrep', 'bin'),
    ];
    for (const directory of tries) {
        if (existsSync(directory)) {
            return directory;
        }
    }

    return null;
}

interface Dependency {
    [Logger.containerKey]: Logger;
    [WebConnection.containerKey]: WebConnection;
}

export class KernelClient extends BaseKernelClient implements Disposable {
    static readonly containerKey = 'KernelClient';

    static readonly namespace = BaseKernelClient.namespace;

    private readonly webConnection: WebConnection;

    private readonly logger: Logger;

    constructor(port: Port, container: DependencyContainer<Dependency>) {
        super(port);
        this.logger = container.get(Logger).with({source: 'KernelClient'});
        this.webConnection = container.get(WebConnection);
    }

    protected handleNotice(notice: ExecutionNotice): void {
        if (notice.action === 'log') {
            const entry = notice.payload as LogEntry;
            this.logger.print(entry);
        }
        else if (notice.action === 'updateInboxThreadList') {
            const list: MessageThreadData[] = notice.payload;
            this.webConnection.broadcast(v => v.call(notice.taskId, 'updateThreadList', list));
        }
    }

    dispose() {
        if (isDisposable(this.port)) {
            this.port.dispose();
        }
    }
}

// By now we run kernel in a worker thread in the same process as VSCode extension,
// to run it in a separate process, use a `ChildProcessPort` and modify `entry.ts` to use a `ProcessPort`.
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

interface Container {
    client: KernelClient | null;
}

interface StartDependency extends EditorHostDependency {
    [WebConnection.containerKey]: WebConnection;
}

const exitTimestamps: number[] = [];
const maxRetries = 5;
const allowedRestartWindow = 60 * 1000;
const kernelContainer: Container = {client: null};

export async function startKernel(container: DependencyContainer<StartDependency>) {
    const logger = container.get(Logger).with({source: 'Kernel'});
    logger.trace('ActivateStart');

    const binaryDirectory = getBinaryDirectory() ?? '';
    logger.trace('ResolveBinaryDirectory', {directory: binaryDirectory});

    const worker = new Worker(
        // After build, this code runs in `extension.js`, kernel entry lives at `kernel/entry.js`
        path.join(__dirname, 'kernel', 'entry.js'),
        {workerData: {privateBinaryDirectory: binaryDirectory}}
    );
    const {threadId} = worker;

    const port = new WorkerPort(worker);
    const hostServer = new EditorHostServer(container);
    await hostServer.connect(port);
    kernelContainer.client = new KernelClient(port, container);
    logger.trace('ActivateFinish', {mode: 'thread', threadId});

    worker.on(
        'error',
        error => {
            logger.error('Error', {threadId, reason: stringifyError(error)});
        }
    );
    worker.on(
        'exit',
        code => {
            kernelContainer.client = null;
            logger.error('Crash', {threadId, exitCode: code});

            exitTimestamps.push(Date.now());
            if (exitTimestamps.length > maxRetries) {
                exitTimestamps.splice(0, exitTimestamps.length - maxRetries);
            }

            const firstExitTimestamp = exitTimestamps[0];
            const lastExitTimestamp = exitTimestamps[exitTimestamps.length - 1];

            if (exitTimestamps.length < maxRetries || lastExitTimestamp - firstExitTimestamp > allowedRestartWindow) {
                logger.info('Restart');
                void startKernel(container);
            }
            else {
                window.showErrorMessage(
                    `Oniichan's kernel crashes ${maxRetries} times within 1 minute, all his capabilities are disabled until next restart`
                );
                logger.error('Die', {threadId});
            }
        }
    );

    return {
        getClient: () => {
            if (kernelContainer.client) {
                return kernelContainer.client;
            }

            throw new Error('Kernel is dead');
        },
        dispose() {
            if (kernelContainer.client) {
                kernelContainer.client.dispose();
            }
        },
    };
}
