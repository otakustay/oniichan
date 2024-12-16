import {MessagePort, parentPort} from 'node:worker_threads';
import {Client, ExecutionMessage, isExecutionMessage, Port} from '@otakustay/ipc';
import {EditorHost, KernelServer} from '@oniichan/kernel';
import {Protocol as HostProtocol} from '@oniichan/host/server';
import {stringifyError} from '@oniichan/shared/string';
import {Logger} from '@oniichan/shared/logger';

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
        const hostClient = new Client<HostProtocol>(port);
        const editorHost = new EditorHost(hostClient);
        const logger = new Logger('Kernel');
        const server = new KernelServer(editorHost, logger);
        await server.connect(port);
    }
    catch (ex) {
        console.error(`Failed to start kernel in worker: ${stringifyError(ex)}`);
        process.exit(500);
    }
}

void main();
