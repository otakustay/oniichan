import {atom, useAtomValue} from 'jotai';
import {Client} from '@otakustay/ipc';
import {Protocol as KernelProtocol} from '@oniichan/kernel';
import {Server} from '../../server';
import {WebSocketPort, VscodeMessagePort} from './port';

export interface Ipc {
    kernel: Client<KernelProtocol>;
}

async function createIpc() {
    const isVscode = location.protocol === 'vscode-webview:';

    if (isVscode) {
        const port = new VscodeMessagePort();
        const kernelClient = new Client<KernelProtocol>(port, {namespace: '-> kernel'});
        const server = new Server({namespace: '-> web'});
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
                    const kernelClient = new Client<KernelProtocol>(port, {namespace: '-> kernel'});
                    const server = new Server({namespace: '-> web'});
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
