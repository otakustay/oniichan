import {atom, useAtomValue} from 'jotai';
import {KernelClient} from '@oniichan/kernel/client';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {WebHostServer} from '../../server.js';
import {WebSocketPort, VscodeMessagePort} from './port.js';

export interface Ipc {
    kernel: KernelClient;
    editor: EditorHostClient;
}

async function createIpc(): Promise<Ipc> {
    const isVscode = location.protocol === 'vscode-webview:';

    if (isVscode) {
        const port = new VscodeMessagePort();
        const kernelClient = new KernelClient(port);
        const editorHostClient = new EditorHostClient(port);
        const server = new WebHostServer();
        await server.connect(port);
        return {kernel: kernelClient, editor: editorHostClient};
    }
    else {
        const executor = (resolve: (value: Ipc) => void) => {
            const socket = new WebSocket(`ws://${location.host}/gateway`);
            socket.addEventListener(
                'open',
                async () => {
                    const port = new WebSocketPort(socket);
                    const kernelClient = new KernelClient(port);
                    const editorHostClient = new EditorHostClient(port);
                    const server = new WebHostServer();
                    await server.connect(port);
                    resolve({kernel: kernelClient, editor: editorHostClient});
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
