import {useEffect, useRef} from 'react';
import styled from '@emotion/styled';
import {useInView} from 'motion/react';
import {BiErrorAlt} from 'react-icons/bi';
import {useMarkMessageStatus} from '@oniichan/web-host/atoms/inbox';
import {Message} from '@oniichan/shared/inbox';
import {TimeAgo} from '@/components/TimeAgo';
import Avatar from '@/components/Avatar';
import Markdown from '@/components/Markdown';
import MessageStatusIcon from '@/components/MessageStatusIcon';

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1em;
    border-radius: 1em;
    background-color: var(--color-default-background);
`;

const Header = styled.div`
    display: flex;
    padding-bottom: .5em;
    border-bottom: 1px solid var(--color-default-bottom);
    align-items: center;
    gap: .2em;
`;

const Time = styled(TimeAgo)`
    color: var(--color-secondary-foreground);
    margin-left: auto;
`;

const Sender = styled.span`
    font-size: 1.2em;
    font-weight: bold;
    display: flex;
    align-items: center;
`;

const Content = styled(Markdown)`
    padding-top: .5em;
    white-space: pre-wrap;
`;

const ErrorLayout = styled.div`
    color: var(--color-error);
    margin-top: 1em;
    display: flex;
    align-items: center;
    gap: 1em;
`;

interface ErrorProps {
    reason: string | undefined;
}

function Error({reason}: ErrorProps) {
    if (!reason) {
        return null;
    }

    return (
        <ErrorLayout>
            <BiErrorAlt />
            {reason}
        </ErrorLayout>
    );
}

interface Props {
    threadUuid: string;
    message: Message;
}

export default function Message({threadUuid, message}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const markMessageStatus = useMarkMessageStatus(threadUuid, message.uuid);
    const markAsRead = useRef(() => markMessageStatus('read'));
    useEffect(
        () => {
            if (message.status === 'unread' && inView) {
                markAsRead.current();
            }
        },
        [message.status, inView]
    );

    return (
        <Layout ref={ref}>
            <Header>
                {message.sender === 'assistant' ? <Avatar.Assistant /> : <Avatar.User />}
                <Sender>
                    {message.sender === 'assistant' ? 'Oniichan' : 'Me'}
                </Sender>
                <MessageStatusIcon status={message.status} />
                <Time time={message.createdAt} />
            </Header>
            <Content content={message.content || '(Empty)'} />
            <Error reason={message.error} />
        </Layout>
    );
}
