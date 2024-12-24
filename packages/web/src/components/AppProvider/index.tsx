import {ReactNode} from 'react';
import ClientProvider, {useClient} from './Client';
import ColorSchemeProvider from './ColorScheme';

export {useClient};

interface Props {
    children: ReactNode;
}

export default function AppProvider({children}: Props) {
    return (
        <ClientProvider>
            <ColorSchemeProvider>
                {children}
            </ColorSchemeProvider>
        </ClientProvider>
    );
}
