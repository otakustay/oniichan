import {useEffect, useRef} from 'react';
import styled from '@emotion/styled';
import {useInView} from 'react-intersection-observer';
import {Message, useMarkMessageStatus} from '@/atoms/inbox';
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

interface Props {
    threadUuid: string;
    message: Message;
}

export default function Message({threadUuid, message}: Props) {
    const {ref, inView} = useInView();
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
            <Content content={message.content} />
        </Layout>
    );
}
