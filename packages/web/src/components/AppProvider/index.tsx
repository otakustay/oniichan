import {ReactNode} from 'react';
import IpcProvider, {useIpc} from './Ipc';
import ColorSchemeProvider from './ColorScheme';

export {useIpc};

interface Props {
    children: ReactNode;
}

export default function AppProvider({children}: Props) {
    return (
        <IpcProvider>
            <ColorSchemeProvider>
                {children}
            </ColorSchemeProvider>
        </IpcProvider>
    );
}
