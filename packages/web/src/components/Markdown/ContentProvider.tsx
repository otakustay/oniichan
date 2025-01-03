import {createContext, ReactElement, use} from 'react';

const Context = createContext('');
Context.displayName = 'MarkdownContentContext';

interface Props {
    content: string;
    children: ReactElement;
}

export default function ContentProvider({content, children}: Props) {
    return <Context value={content}>{children}</Context>;
}

export function useMarkdownContent() {
    return use(Context);
}
