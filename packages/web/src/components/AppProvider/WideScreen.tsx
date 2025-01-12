import {mediaWideScreen} from '@/styles';
import {createContext, ReactNode, use, useEffect, useState} from 'react';

const Context = createContext(false);
Context.displayName = 'WideScreenContext';

interface Props {
    children: ReactNode;
}

const match = matchMedia(`(${mediaWideScreen})`);

export default function WideScreenProvider({children}: Props) {
    const [isWideScreen, setWideScreen] = useState(match.matches);
    useEffect(
        () => {
            const callback = (event: MediaQueryListEvent) => {
                setWideScreen(event.matches);
            };
            match.addEventListener('change', callback);
            return () => {
                match.removeEventListener('change', callback);
            };
        },
        []
    );

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
