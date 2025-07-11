import EventEmitter from 'node:events';
import fastify from 'fastify';
import type {FastifyInstance} from 'fastify';
import webSocket from '@fastify/websocket';
import serveStatic from '@fastify/static';
import proxy from '@fastify/http-proxy';
import type {WebSocket} from 'ws';
import detectPort from 'detect-port';
import {isExecutionMessage} from '@otakustay/ipc';
import type {ExecutionMessage, Port} from '@otakustay/ipc';
import {stringifyError} from '@oniichan/shared/error';
import type {DependencyContainer} from '@oniichan/shared/container';
import type {LoadingManager} from '@oniichan/editor-host/ui/loading';
import type {ResourceManager} from '@oniichan/editor-host/utils/resource';
import type {Logger} from '@oniichan/shared/logger';
import type {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import type {WorkspaceFileStructure} from '@oniichan/shared/dir';
import type {KernelClient} from '../../kernel/index.js';
import {establishIpc} from './ipc.js';
import type {WebConnection} from './connection.js';

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

interface ServerEventMap {
    port: [number | null];
    error: [string];
}

export interface ServerInit {
    staticDirectory: string;
}

interface Dependency {
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
    [ResourceManager.containerKey]: ResourceManager;
    [KernelClient.containerKey]: KernelClient;
    [WebConnection.containerKey]: WebConnection;
}

export class WebAppServer extends EventEmitter<ServerEventMap> {
    port: number | null = null;

    private readonly app: FastifyInstance;

    private readonly container: DependencyContainer<Dependency>;

    private readonly staticDirectory: string;

    constructor(container: DependencyContainer<Dependency>, init: ServerInit) {
        super();
        this.container = container;
        this.app = fastify();
        this.staticDirectory = init.staticDirectory;
    }

    async start() {
        await this.app.register(webSocket);
        this.app.get(
            '/gateway',
            {websocket: true},
            async socket => {
                const container = this.container.bind('Port', () => new WebSocketPort(socket), {singleton: true});
                const disposable = await establishIpc(container);
                socket.on('close', () => void disposable.dispose());
            }
        );
        if (process.env.NODE_ENV === 'development') {
            await this.app.register(proxy, {upstream: 'http://localhost:8988'});
        }
        else {
            await this.app.register(serveStatic, {root: this.staticDirectory});
        }

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
