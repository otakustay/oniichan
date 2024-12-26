import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import Thread from '@/components/Thread';
import Inbox from '@/components/Inbox';
import Draft from '@/components/Draft';
import {useActiveMessageThreadValue, useSetMessagelThreadList} from '@oniichan/web-host/atoms/inbox';
import {useIpc} from '../AppProvider';

const ErrorLabel = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2em;
    display: flex;
    align-items: center;
    background-color: var(--color-error);
    color: var(--color-interactive-foreground);
`;

function Body() {
    const activeThread = useActiveMessageThreadValue();

    if (activeThread) {
        return <Thread uuid={activeThread.uuid} />;
    }

    return <Inbox />;
}

export default function App() {
    const setThreadList = useSetMessagelThreadList();
    const [error, setError] = useState('');
    const ipc = useIpc();
    useEffect(
        () => {
            void (async () => {
                try {
                    const threads = await ipc.kernel.call(crypto.randomUUID(), 'inboxGetThreadList');
                    setThreadList(threads);
                }
                catch {
                    setError('Failed to fetch inbox threads');
                }
            })();
        },
        [ipc, setThreadList]
    );
    return (
        <>
            <Body />
            <Draft />
            {error && <ErrorLabel>{error}</ErrorLabel>}
        </>
    );
}
