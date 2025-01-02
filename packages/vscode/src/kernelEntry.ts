import {MessagePort, parentPort} from 'node:worker_threads';
import {ExecutionMessage, isExecutionMessage, Port} from '@otakustay/ipc';
import {KernelServer} from '@oniichan/kernel/server';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {stringifyError} from '@oniichan/shared/string';
import {ConsoleLogger} from '@oniichan/shared/logger';

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
    try {
        const port = new WorkerPort();
        const editorHostClient = new EditorHostClient(port);
        const logger = new ConsoleLogger('Kernel');
        const server = new KernelServer(editorHostClient, logger);
        await server.connect(port);
    }
    catch (ex) {
        console.error(`Failed to start kernel in worker: ${stringifyError(ex)}`);
        process.exit(500);
    }
}

void main();
