import {EditorHost, KernelServer, Protocol as KernelProtocol} from '@oniichan/kernel';
import {HostServer, Protocol as HostProtocol} from '@oniichan/host';
import {Client, DirectPort} from '@otakustay/ipc';

// 1. `HostServer` must run in VSCode extension runtime
// 2. `KernelServer` connects to `HostServer` via `hostToKernelPort`
// 3. `Kernel` is a client that VSCode extension uses to access `KernelServer`
// 4. Once we want to run `KernelServer` in a separate process, do this:
//   1. Change `hostToKernelPort` to a process port
//   2. Change `kernelPort` to a child process port
// 5. To go further, when kernel requires LSP, we can also easily implement a `LspPort` to handle this

async function createEditorHost() {
    const hostToKernelPort = new DirectPort();
    const hostServer = new HostServer();
    await hostServer.connect(hostToKernelPort);
    const hostClient = new Client<HostProtocol>(hostToKernelPort);
    const editorHost = new EditorHost(hostClient);
    return editorHost;
}

export class KernelClient extends Client<KernelProtocol> {
    static readonly containerKey = 'KernelClient';
}

export async function createKernelClient(): Promise<KernelClient> {
    const editorHost = await createEditorHost();
    const server = new KernelServer(editorHost);
    const kernelPort = new DirectPort();
    await server.connect(kernelPort);
    const kernelClient = new KernelClient(kernelPort);
    return kernelClient;
}
