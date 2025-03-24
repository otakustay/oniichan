import {useState, useEffect} from 'react';
import styled from '@emotion/styled';
import {motion} from 'motion/react';
import type {MessageData, MessageThreadData} from '@oniichan/shared/inbox';
import {
    useMessageThreadListValue,
    useSetActiveMessageThread,
    useSetMessagelThreadList,
} from '@oniichan/web-host/atoms/inbox';
import {useSetEditing} from '@oniichan/web-host/atoms/draft';
import {assertNever} from '@oniichan/shared/error';
import MessageStatusIcon from '../MessageStatusIcon';
import {mediaWideScreen} from '@/styles';
import {TimeAgo} from '@/components/TimeAgo';
import {useIpc} from '@/components/AppProvider';

const ItemLayout = styled(motion.div)`
    padding: 1em;
    border-bottom: 1px solid var(--color-default-border);

    &:hover {
        background-color: var(--color-default-background-hover);
        cursor: pointer;
    }
`;

const ItemHeader = styled.div`
    height: 2em;
    display: flex;
    align-items: center;
    gap: .5em;
`;

const ItemTitle = styled.span`
    font-size: 1.2em;
    font-weight: bold;
    gap: 0.5em;
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

const ItemDateTime = styled(TimeAgo)`
    color: var(--color-secondary-foreground);
`;

const ItemContent = styled.div`
    overflow: hidden;
    color: var(--color-secondary-foreground);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
`;

const ErrorLabel = styled.div`
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 2em;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--color-error);
    color: var(--color-interactive-foreground);
`;

interface ThreadItemProps {
    thread: MessageThreadData;
}

const Layout = styled.div`
    display: flex;
    flex-direction: column;

    @media (${mediaWideScreen}) {
        background-color: var(--color-default-background);
    }
`;

function resolveMessageContent(message: MessageData) {
    switch (message.type) {
        case 'userRequest':
        case 'toolUse':
            return message.content;
        case 'assistantText':
        case 'toolCall':
            return message.chunks.map(v => (v.type === 'text' ? v.content : '')).join('\n\n');
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

function ThreadItem({thread}: ThreadItemProps) {
    const setActive = useSetActiveMessageThread();
    const setEditing = useSetEditing();
    const lastRoundtrip = thread.roundtrips.at(-1);
    const request = thread.roundtrips.at(0)?.request;
    const lastMessage = thread.roundtrips.at(-1)?.responses.at(-1);
    const select = () => {
        setActive(thread.uuid);
        setEditing(null);
    };

    return (
        <ItemLayout layout="position" onClick={select}>
            <ItemHeader>
                <MessageStatusIcon status={lastRoundtrip?.status ?? 'read'} />
                <ItemTitle>
                    {request ? resolveMessageContent(request) : '(No Title)'}
                </ItemTitle>
                {lastMessage && <ItemDateTime time={lastMessage.createdAt} />}
            </ItemHeader>
            <ItemContent>
                {lastMessage ? resolveMessageContent(lastMessage) : '(Empty)'}
            </ItemContent>
        </ItemLayout>
    );
}

export default function ThreadList() {
    const [error, setError] = useState('');
    const dataSource = useMessageThreadListValue();
    const setThreadList = useSetMessagelThreadList();
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
        <Layout>
            {dataSource.map(v => <ThreadItem key={v.uuid} thread={v} />)}
            {error && <ErrorLabel>{error}</ErrorLabel>}
        </Layout>
    );
}
