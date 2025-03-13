import {useEffect, useRef} from 'react';
import type {ReactElement, ReactNode, RefObject} from 'react';
import styled from '@emotion/styled';
import {useInView} from 'motion/react';
import {BiErrorAlt} from 'react-icons/bi';
import {useMarkMessageStatus} from '@oniichan/web-host/atoms/inbox';
import {assertNever} from '@oniichan/shared/error';
import type {MessageViewChunk, RoundtripStatus, MessageViewData} from '@oniichan/shared/inbox';
import {TimeAgo} from '@/components/TimeAgo';
import Avatar from '@/components/Avatar';
import MessageStatusIcon from '@/components/MessageStatusIcon';
import {MessageContextProvider} from './MessageContext';
import MessageContent from './MessageContent';
import Indicator from './Indicator';
import Rollback from './Rollback';

function resolveSenderName(message: MessageViewData) {
    switch (message.type) {
        case 'assistantResponse':
            return 'Oniichan';
        case 'userRequest':
            return 'Me';
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

function renderAvatar(message: MessageViewData) {
    switch (message.type) {
        case 'assistantResponse':
            return <Avatar.Assistant size="1.5em" />;
        case 'userRequest':
            return <Avatar.User size="1.5em" />;
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

function resolveMessageContent(message: MessageViewData): MessageViewChunk[] {
    switch (message.type) {
        case 'userRequest':
            return [{type: 'text', content: message.content}];
        case 'assistantResponse':
            return message.chunks;
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

interface LayoutProps {
    compact: boolean | undefined;
}

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1em;
    border-radius: var(--item-border-radius, 0);
    background-color: var(--color-default-background);

`;

const Header = styled.div<LayoutProps>`
    display: flex;
    padding-bottom: ${props => props.compact ? '.5em' : '1em'};
    border-bottom: 1px solid var(--color-default-bottom);
    align-items: center;
    gap: .4em;
`;

const Time = styled(TimeAgo)`
    color: var(--color-secondary-foreground);
`;

const HeaderEnd = styled.div`
    display: inline-flex;
    align-items: center;
    gap: .5em;
    margin-left: auto;
`;

const Sender = styled.span`
    font-size: 1.2em;
    font-weight: bold;
    display: flex;
    align-items: center;
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

interface MessageLayoutProps {
    className?: string;
    ref?: RefObject<HTMLDivElement | null>;
    compact?: boolean;
    avatar: ReactElement;
    authorName: string;
    headerAddition?: ReactNode;
    body: ReactNode;
}

function MessageLayout({className, ref, compact, avatar, authorName, headerAddition, body}: MessageLayoutProps) {
    return (
        <Layout className={className} ref={ref}>
            <Header compact={compact}>
                {avatar}
                <Sender>{authorName}</Sender>
                {headerAddition}
            </Header>
            {body}
        </Layout>
    );
}

interface Props {
    threadUuid: string;
    roundtripStatus: RoundtripStatus;
    message: MessageViewData;
    showIndicator: boolean;
    showRollback: boolean;
    reasoning: boolean;
}

function Message({threadUuid, roundtripStatus, message, showIndicator, showRollback, reasoning}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const markMessageStatus = useMarkMessageStatus(threadUuid, message.uuid);
    const markAsRead = useRef(() => markMessageStatus('read'));
    useEffect(
        () => {
            if (message.type === 'assistantResponse' && roundtripStatus === 'unread' && inView) {
                markAsRead.current();
            }
        },
        [message.type, roundtripStatus, inView]
    );
    const chunks = resolveMessageContent(message);

    return (
        <MessageContextProvider threadUuid={threadUuid} messageUuid={message.uuid}>
            <MessageLayout
                ref={ref}
                avatar={renderAvatar(message)}
                authorName={resolveSenderName(message)}
                headerAddition={
                    <>
                        <MessageStatusIcon status={message.type === 'assistantResponse' ? roundtripStatus : 'read'} />
                        <HeaderEnd>
                            {showRollback && <Rollback threadUuid={threadUuid} messageUuid={message.uuid} />}
                            <Time time={message.createdAt} />
                        </HeaderEnd>
                    </>
                }
                body={
                    <>
                        <MessageContent chunks={chunks} reasoning={reasoning} />
                        {showIndicator && <Indicator chunk={chunks.at(-1) ?? null} />}
                        <Error reason={message.error} />
                    </>
                }
            />
        </MessageContextProvider>
    );
}

export default Object.assign(Message, {Layout: MessageLayout});
