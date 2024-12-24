import {atom, useAtomValue} from 'jotai';
import {Client} from '@otakustay/ipc';
import {Protocol as WebToIdeProtocol} from '@oniichan/server/protocol';
import {WebSocketPort, VscodeMessagePort} from './port';
import {Server} from '@/server';

async function createIpc() {
    const isVscode = location.protocol === 'vscode-webview:';

    if (isVscode) {
        const port = new VscodeMessagePort();
        const client = new Client<WebToIdeProtocol>(port, {namespace: 'web -> ide'});
        const server = new Server({namespace: 'ide -> web'});
        await server.connect(port);
        return client;
    }
    else {
        const executor = (resolve: (value: Client<WebToIdeProtocol>) => void) => {
            const socket = new WebSocket(`ws://${location.host}/gateway`);
            socket.addEventListener(
                'open',
                async () => {
                    const port = new WebSocketPort(socket);
                    const client = new Client<WebToIdeProtocol>(port, {namespace: 'web -> ide'});
                    const server = new Server({namespace: 'ide -> web'});
                    await server.connect(port);
                    resolve(client);
                }
            );
        };
        return new Promise(executor);
    }
}

export const clientAtom = atom(createIpc);

export function useClientValue() {
    const client = useAtomValue(clientAtom);
    return client;
}
