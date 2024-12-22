import {ReactNode} from 'react';
import ClientProvider, {useClient} from './Client';

export {useClient};

interface Props {
    children: ReactNode;
}

export default function AppProvider({children}: Props) {
    return (
        <ClientProvider>
            {children}
        </ClientProvider>
    );
}
