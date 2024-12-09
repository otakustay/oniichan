import EventEmitter from 'node:events';
import fastify, {FastifyInstance} from 'fastify';
import webSocket from '@fastify/websocket';
import serveStatic from '@fastify/static';
import {WebSocket} from 'ws';
import detectPort from 'detect-port';
import {ExecutionMessage, Port} from '@otakustay/ipc';
import {stringifyError} from '@oniichan/shared/string';
import {IpcServer} from './server';

function isExecutionMesssage(message: any): message is ExecutionMessage {
    return 'taskId' in message;
}

class WebSocketPort implements Port {
    private readonly socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    send(message: ExecutionMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.socket.on(
            'message',
            (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());
                    if (isExecutionMesssage(data)) {
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

interface ServerEventMap {
    port: [number | null];
    error: [string];
}

export interface ServerInit {
    staticDirectory: string;
}

export class Server extends EventEmitter<ServerEventMap> {
    port: number | null = null;

    private readonly app: FastifyInstance;

    private readonly staticDirectory: string;

    constructor(init: ServerInit) {
        super();
        this.app = fastify();
        this.staticDirectory = init.staticDirectory;
    }

    async start() {
        await this.app.register(serveStatic, {root: this.staticDirectory});
        await this.app.register(webSocket);
        this.app.get(
            '/gateway',
            {websocket: true},
            async socket => {
                const port = new WebSocketPort(socket);
                const ipcServer = new IpcServer();
                await ipcServer.connect(port);
            }
        );

        try {
            this.port = await detectPort(17748);
            await this.app.listen({port: this.port, host: '127.0.0.1'});
            this.emit('port', this.port);
        }
        catch (ex) {
            this.port = null;
            this.emit('port', null);
            this.emit('error', stringifyError(ex));
        }
    }

    async close() {
        try {
            await this.app.close();
            this.port = null;
            this.emit('port', null);
        }
        catch (ex) {
            this.emit('error', stringifyError(ex));
        }
    }
}
