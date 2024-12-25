import styled from '@emotion/styled';
import {motion} from 'motion/react';
import {MessageThread, useMessageThreadListValue, useSetActiveMessageThread} from '@oniichan/web-host/atoms/inbox';
import {TimeAgo} from '@/components/TimeAgo';
import MessageStatusIcon from '../MessageStatusIcon';

const ItemLayout = styled(motion.div)`
    padding: 1em;
    border-bottom: 1px solid var(--color-default-border);
    background-color: var(--color-default-background);

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

interface ThreadItemProps {
    thread: MessageThread;
}

const Layout = styled.div`
    display: flex;
    flex-direction: column;
`;

function ThreadItem({thread}: ThreadItemProps) {
    const setActive = useSetActiveMessageThread();
    const firstMessage = thread.messages.at(-1);
    const lastMessage = thread.messages.at(0);

    return (
        <ItemLayout
            layout="position"
            onClick={() => setActive(thread.uuid)}
        >
            <ItemHeader>
                <MessageStatusIcon status={lastMessage?.status ?? 'read'} />
                <ItemTitle>
                    {firstMessage?.content ?? '(No Title)'}
                </ItemTitle>
                {lastMessage && <ItemDateTime time={lastMessage.createdAt} />}
            </ItemHeader>
            <ItemContent>
                {lastMessage?.content ?? '(Empty)'}
            </ItemContent>
        </ItemLayout>
    );
}

export default function ThreadList() {
    const dataSource = useMessageThreadListValue();

    return (
        <>
            <Layout>
                {dataSource.map(v => <ThreadItem key={v.uuid} thread={v} />)}
            </Layout>
        </>
    );
}
