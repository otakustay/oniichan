import {MessagePort, parentPort, workerData} from 'node:worker_threads';
import {ExecutionMessage, isExecutionMessage, Port} from '@otakustay/ipc';
import {KernelServer} from '@oniichan/kernel/server';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {ThreadStore, CommandExecutor} from '@oniichan/kernel';
import {stringifyError} from '@oniichan/shared/error';
import {Logger, ConsoleLogger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';
import {MessageThreadPersistData} from '@oniichan/shared/inbox';

const initialMessageThreads: MessageThreadPersistData[] = [];

if (process.env.NODE_ENV === 'development') {
    initialMessageThreads.push();
}

class WorkerPort implements Port {
    private readonly port: MessagePort;

    constructor() {
        if (!parentPort) {
            throw new Error('Worker thread is not available');
        }

        this.port = parentPort;
    }

    send(message: ExecutionMessage): void {
        this.port.postMessage(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.port.on(
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

async function main() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const binaryDirectory: string = workerData.privateBinaryDirectory;

    if (!binaryDirectory) {
        console.error(`Binary directory is not specified`);
        process.exit(400);
    }

    try {
        const port = new WorkerPort();
        const container = new DependencyContainer()
            .bind(ThreadStore, () => new ThreadStore(initialMessageThreads), {singleton: true})
            .bind(EditorHostClient, () => new EditorHostClient(port), {singleton: true})
            .bind(Logger, () => new ConsoleLogger('Kernel'), {singleton: true})
            .bind(CommandExecutor, () => new CommandExecutor(binaryDirectory), {singleton: true});
        const server = new KernelServer(container);
        await server.connect(port);
    }
    catch (ex) {
        console.error(`Failed to start kernel in worker: ${stringifyError(ex)}`);
        process.exit(500);
    }
}

void main();
