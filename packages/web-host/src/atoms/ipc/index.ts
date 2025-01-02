import {atom, useAtomValue} from 'jotai';
import {KernelClient} from '@oniichan/kernel/client';
import {WebHostServer} from '../../server';
import {WebSocketPort, VscodeMessagePort} from './port';

export interface Ipc {
    kernel: KernelClient;
}

async function createIpc() {
    const isVscode = location.protocol === 'vscode-webview:';

    if (isVscode) {
        const port = new VscodeMessagePort();
        const kernelClient = new KernelClient(port);
        const server = new WebHostServer();
        await server.connect(port);
        return {kernel: kernelClient};
    }
    else {
        const executor = (resolve: (value: Ipc) => void) => {
            const socket = new WebSocket(`ws://${location.host}/gateway`);
            socket.addEventListener(
                'open',
                async () => {
                    const port = new WebSocketPort(socket);
                    const kernelClient = new KernelClient(port);
                    const server = new WebHostServer();
                    await server.connect(port);
                    resolve({kernel: kernelClient});
                }
            );
        };
        return new Promise(executor);
    }
}

export const ipcAtom = atom(createIpc);

export function useIpcValue() {
    const ipc = useAtomValue(ipcAtom);
    return ipc;
}
