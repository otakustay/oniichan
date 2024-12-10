import {createContext, ReactNode, use, useEffect, useState} from 'react';
import {Protocol} from '@oniichan/server/protocol';
import {Client, DirectPort} from '@otakustay/ipc';
import LoadingSplash from './LoadingSplash';
import {WebSocketPort, VscodeMessagePort} from './port';

interface ClientContextValue {
    client: Client<Protocol>;
}

const Context = createContext<ClientContextValue>({client: new Client(new DirectPort())});
Context.displayName = 'ClientContext';

interface Props {
    children: ReactNode;
}

export default function ClientProvider({children}: Props) {
    const [ipcClient, setIpcClient] = useState<Client<Protocol> | null>(null);
    useEffect(
        () => {
            const isVscode = location.protocol === 'vscode-webview:';

            if (isVscode) {
                const port = new VscodeMessagePort();
                const client = new Client<Protocol>(port);
                setIpcClient(client);
            }
            else {
                const socket = new WebSocket(`ws://${location.host}/gateway`);
                socket.addEventListener(
                    'open',
                    () => {
                        const port = new WebSocketPort(socket);
                        const client = new Client<Protocol>(port);
                        setIpcClient(client);
                    }
                );

                return () => {
                    socket.close();
                };
            }
        },
        []
    );

    if (ipcClient === null) {
        return <LoadingSplash />;
    }

    return (
        <Context value={{client: ipcClient}}>
            {children}
        </Context>
    );
}

export function useClient() {
    const {client} = use(Context);
    return client;
}
