import {ReactNode} from 'react';
import IpcProvider, {useIpc} from './Ipc';
import ColorSchemeProvider, {useColorScheme} from './ColorScheme';
import WideScreenProvider, {useIsWideScreen} from './WideScreen';

export {useIpc, useColorScheme, useIsWideScreen};

interface Props {
    children: ReactNode;
}

export default function AppProvider({children}: Props) {
    return (
        <IpcProvider>
            <WideScreenProvider>
                <ColorSchemeProvider>
                    {children}
                </ColorSchemeProvider>
            </WideScreenProvider>
        </IpcProvider>
    );
}
