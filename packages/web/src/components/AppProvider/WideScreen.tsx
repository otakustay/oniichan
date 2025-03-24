import {createContext, use} from 'react';
import type {ReactNode} from 'react';
import {useMedia} from 'huse';
import {mediaWideScreen} from '@/styles';

const Context = createContext(false);
Context.displayName = 'WideScreenContext';

interface Props {
    children: ReactNode;
}

export default function WideScreenProvider({children}: Props) {
    const isWideScreen = useMedia(`(${mediaWideScreen})`);

    return (
        <Context value={isWideScreen}>
            {children}
        </Context>
    );
}

export function useIsWideScreen() {
    const result = use(Context);
    return result;
}
