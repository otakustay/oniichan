import {createContext, use, useEffect, useState} from 'react';
import type {ReactNode} from 'react';

interface ColorSchemeResult {
    source: 'vscode' | 'html';
    scheme: 'light' | 'dark';
}

function getColorScheme(): ColorSchemeResult {
    if (document.body.classList.contains('vscode-dark')) {
        return {source: 'vscode', scheme: 'dark'};
    }
    if (document.body.classList.contains('vscode-light')) {
        return {source: 'html', scheme: 'light'};
    }
    return {
        source: 'html',
        scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    };
}

const Context = createContext<ColorSchemeResult>(getColorScheme());
Context.displayName = 'ColorSchemeContext';

interface Props {
    children: ReactNode;
}

export default function ColorSchemeProvider({children}: Props) {
    const [scheme, setScheme] = useState(() => getColorScheme());
    useEffect(
        () => {
            if (scheme.source === 'vscode') {
                const callback: MutationCallback = mutationsList => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            setScheme(getColorScheme());
                            return;
                        }
                    }
                };
                const observer = new MutationObserver(callback);
                observer.observe(document.body, {attributes: true, attributeFilter: ['class']});
                return () => {
                    observer.disconnect();
                };
            }
            else {
                const callback = () => {
                    setScheme(getColorScheme());
                };
                const match = matchMedia('(prefers-color-scheme: dark)');
                match.addEventListener('change', callback);
                return () => {
                    match.removeEventListener('change', callback);
                };
            }
        },
        [scheme.source]
    );

    return (
        <Context value={scheme}>
            {children}
        </Context>
    );
}

export function useColorScheme() {
    const result = use(Context);
    return result.scheme;
}
