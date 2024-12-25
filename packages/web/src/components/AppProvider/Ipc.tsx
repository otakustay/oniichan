import {createContext, ReactNode, use} from 'react';
import {Client, DirectPort} from '@otakustay/ipc';
import {Ipc, useIpcValue} from '@/atoms/ipc';

const emptyClient = new Client(new DirectPort());

const Context = createContext<Ipc>({kernel: emptyClient});
Context.displayName = 'IpcContext';

interface Props {
    children: ReactNode;
}

export default function IpcProvider({children}: Props) {
    const ipc = useIpcValue();

    return (
        <Context value={ipc}>
            {children}
        </Context>
    );
}

export function useIpc() {
    const ipc = use(Context);
    return ipc;
}
