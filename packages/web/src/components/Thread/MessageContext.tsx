import {createContext, use} from 'react';
import type {ReactNode} from 'react';

interface MessageContextValue {
    threadUuid: string;
    messageUuid: string;
}

const MessageContext = createContext<MessageContextValue>({threadUuid: '', messageUuid: ''});

MessageContext.displayName = 'MessageContext';

interface Props {
    threadUuid: string;
    messageUuid: string;
    children: ReactNode;
}

export function MessageContextProvider({threadUuid, messageUuid, children}: Props) {
    return (
        <MessageContext.Provider value={{threadUuid, messageUuid}}>
            {children}
        </MessageContext.Provider>
    );
}

export function useMessageIdentity(): MessageContextValue {
    return use(MessageContext);
}
