import {useEffect, useRef, useState} from 'react';
import styled from '@emotion/styled';
import {useInView} from 'motion/react';
import {BiErrorAlt} from 'react-icons/bi';
import {IoCaretUpOutline, IoCaretDownOutline} from 'react-icons/io5';
import {useMarkMessageStatus} from '@oniichan/web-host/atoms/inbox';
import {assertNever} from '@oniichan/shared/error';
import {MessageData} from '@oniichan/shared/inbox';
import {TimeAgo} from '@/components/TimeAgo';
import Avatar from '@/components/Avatar';
import MessageStatusIcon from '@/components/MessageStatusIcon';
import MessageContent from './MessageContent';
import InteractiveLabel from '../InteractiveLabel';

function resolveSenderName(message: MessageData) {
    switch (message.type) {
        case 'assistantText':
        case 'toolCall':
            return 'Oniichan';
        case 'toolUse':
            return 'Super Tool';
        case 'userRequest':
            return 'Me';
        case 'debug':
            return message.title;
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

function isCollapsable(message: MessageData) {
    return message.type === 'debug' || message.type === 'toolUse';
}

function renderAvatar(message: MessageData) {
    switch (message.type) {
        case 'assistantText':
        case 'toolCall':
            return <Avatar.Assistant size="1.5em" />;
        case 'toolUse':
            return <Avatar.Tool size="1.5em" />;
        case 'debug':
            return <Avatar.Debug size="1.5em" />;
        case 'userRequest':
            return <Avatar.User size="1.5em" />;
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

function resolveMessageContent(message: MessageData) {
    switch (message.type) {
        case 'userRequest':
        case 'toolUse':
        case 'debug':
            return message.content;
        case 'assistantText':
        case 'toolCall':
            return message.chunks;
        default:
            assertNever<{type: string}>(message, v => `Unknown message type ${v.type}`);
    }
}

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1em;
    border-radius: var(--item-border-radius, 0);
    background-color: var(--color-default-background);

`;

const Content = styled(MessageContent)<{collapsed: boolean}>`
    max-height: ${props => (props.collapsed ? '200px' : undefined)};
    overflow-y: hidden;
`;

const Header = styled.div`
    display: flex;
    padding-bottom: .5em;
    border-bottom: 1px solid var(--color-default-bottom);
    align-items: center;
    gap: .4em;
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

const ToggleLayout = styled(InteractiveLabel)`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: .5em 0;
    gap: .5em;
`;

interface ToggleProps {
    collapsed: boolean;
    onToggle: (value: boolean) => void;
}

function Toggle({collapsed, onToggle}: ToggleProps) {
    return (
        <ToggleLayout as="div" onClick={() => onToggle(!collapsed)}>
            {collapsed ? <IoCaretDownOutline /> : <IoCaretUpOutline />}
            {collapsed ? 'Show more' : 'Show less'}
        </ToggleLayout>
    );
}

interface Props {
    threadUuid: string;
    message: MessageData;
}

export default function Message({threadUuid, message}: Props) {
    const [collapsed, setCollapsed] = useState(isCollapsable(message) ? true : false);
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const markMessageStatus = useMarkMessageStatus(threadUuid, message.uuid);
    const markAsRead = useRef(() => markMessageStatus('read'));
    useEffect(
        () => {
            // TODO: Seems it doesn't get triggered without scroll of web page
            if (message.status === 'unread' && inView) {
                markAsRead.current();
            }
        },
        [message.status, inView]
    );

    return (
        <Layout ref={ref}>
            <Header>
                {renderAvatar(message)}
                <Sender>{resolveSenderName(message)}</Sender>
                <MessageStatusIcon status={message.status} />
                <Time time={message.createdAt} />
            </Header>
            <Content content={resolveMessageContent(message)} collapsed={collapsed} />
            {isCollapsable(message) && <Toggle collapsed={collapsed} onToggle={setCollapsed} />}
            <Error reason={message.error} />
        </Layout>
    );
}
