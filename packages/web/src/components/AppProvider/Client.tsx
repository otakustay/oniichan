import {createContext, ReactNode, use} from 'react';
import {Protocol} from '@oniichan/server/protocol';
import {Client, DirectPort} from '@otakustay/ipc';
import {useClientValue} from '@/atoms/client';

const Context = createContext<Client<Protocol>>(new Client(new DirectPort()));
Context.displayName = 'ClientContext';

interface Props {
    children: ReactNode;
}

export default function ClientProvider({children}: Props) {
    const client = useClientValue();

    return (
        <Context value={client}>
            {children}
        </Context>
    );
}

export function useClient() {
    const client = use(Context);
    return client;
}
