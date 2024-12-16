import {MessagePort, parentPort, threadId} from 'node:worker_threads';
import {EditorHost, KernelServer} from '@oniichan/kernel';
import {Protocol as HostProtocol} from '@oniichan/host/server';
import {Client, ExecutionMessage, isExecutionMessage, Port} from '@otakustay/ipc';
import {stringifyError} from '@oniichan/shared/string';

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
    console.log('Starting kernel in worker');
    try {
        const port = new WorkerPort();
        const hostClient = new Client<HostProtocol>(port);
        const editorHost = new EditorHost(hostClient);
        const server = new KernelServer(editorHost);
        await server.connect(port);
    }
    catch (ex) {
        console.error(`Failed to start kernel in worker: ${stringifyError(ex)}`);
        process.exit(500);
    }
    console.log(`Kernel started in worker ${threadId}`);
}

void main();
