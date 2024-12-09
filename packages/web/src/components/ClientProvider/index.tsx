import {createContext, ReactNode, use, useEffect, useState} from 'react';
import {Protocol} from '@oniichan/server/protocol';
import {Client, DirectPort, ExecutionMessage, Port} from '@otakustay/ipc';
import LoadingSplash from './LoadingSplash';

function isExecutionMesssage(message: any): message is ExecutionMessage {
    return 'taskId' in message;
}

class WebSocketPort implements Port {
    private readonly socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    send(message: ExecutionMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.socket.addEventListener(
            'message',
            (event: MessageEvent<string>) => {
                try {
                    const data = JSON.parse(event.data);
                    if (isExecutionMesssage(data)) {
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
