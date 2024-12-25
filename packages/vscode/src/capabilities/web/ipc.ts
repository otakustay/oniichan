import {Client, ExecutionRequest, Port, RequestHandler, Server, ServerInit} from '@otakustay/ipc';
import {Protocol as KernelProtocol} from '@oniichan/kernel';
import {DependencyContainer} from '@oniichan/shared/container';

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
    KernelClient: Client<KernelProtocol>;
    Port: Port;
}

export async function establishIpc(container: DependencyContainer<Dependency>) {
    const port = container.get('Port');
    const kernelClient = container.get('KernelClient');
    const kernelServer = new BridgeServer(kernelClient, {namespace: '-> kernel'});
    await kernelServer.connect(port);
}
