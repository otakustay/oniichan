import {Client, ExecutionRequest, Port, RequestHandler, Server, ServerInit} from '@otakustay/ipc';
import {DependencyContainer} from '@oniichan/shared/container';
import {KernelClient} from '../../kernel';
import {EditorHostServer} from '@oniichan/editor-host/server';
import {LoadingManager} from '@oniichan/editor-host/ui/loading';
import {DiffViewManager} from '@oniichan/editor-host/ui/diff';
import {Logger} from '@oniichan/shared/logger';
import {ExtensionContext} from 'vscode';

class BridgeHandler extends RequestHandler<any, any, any> {
    private readonly upstream: Client<any>;

    private readonly action: string;

    constructor(upstream: Client<any>, port: Port, request: ExecutionRequest, context: null) {
        super(port, request, context);
        this.action = request.action;
        this.upstream = upstream;
    }

    async *handleRequest(payload: any): AsyncIterable<any> {
        yield* this.upstream.callStreaming(this.getTaskId(), this.action, payload);
    }
}

class BridgeServer<P extends Record<keyof P, () => AsyncIterable<any>>> extends Server<P> {
    private readonly upstream: Client<P>;

    constructor(upstream: Client<P>, init?: ServerInit) {
        super(init);
        this.upstream = upstream;
    }

    protected async createHandlerInstance(request: ExecutionRequest) {
        if (!this.port) {
            return null;
        }

        const handler = new BridgeHandler(this.upstream, this.port, request, null);
        return handler;
    }

    protected async createContext() {
        return null;
    }

    protected initializeHandlers() {
    }
}

interface Dependency {
    [KernelClient.containerKey]: KernelClient;
    [LoadingManager.containerKey]: LoadingManager;
    [Logger.containerKey]: Logger;
    [DiffViewManager.containerKey]: DiffViewManager;
    ExtensionContext: ExtensionContext;
    Port: Port;
}

export async function establishIpc(container: DependencyContainer<Dependency>) {
    const port = container.get('Port');

    const kernelClient = container.get('KernelClient');
    const kernelServer = new BridgeServer(kernelClient, {namespace: KernelClient.namespace});
    await kernelServer.connect(port);
    const disposable = kernelClient.addWebPort(port);

    const editorHostServer = new EditorHostServer(container);
    await editorHostServer.connect(port);

    return disposable;
}
