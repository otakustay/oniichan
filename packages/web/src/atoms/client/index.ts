import {atom, useAtomValue} from 'jotai';
import {Client} from '@otakustay/ipc';
import {Protocol} from '@oniichan/server/protocol';
import {WebSocketPort, VscodeMessagePort} from './port';

async function createClient() {
    const isVscode = location.protocol === 'vscode-webview:';

    if (isVscode) {
        const port = new VscodeMessagePort();
        const client = new Client<Protocol>(port);
        return client;
    }
    else {
        const executor = (resolve: (value: Client<Protocol>) => void) => {
            const socket = new WebSocket(`ws://${location.host}/gateway`);
            socket.addEventListener(
                'open',
                () => {
                    const port = new WebSocketPort(socket);
                    const client = new Client<Protocol>(port, {namespace: 'web -> server'});
                    resolve(client);
                }
            );
        };
        return new Promise(executor);
    }
}

const clientAtom = atom(createClient);

export function useClientValue() {
    const client = useAtomValue(clientAtom);
    return client;
}
