import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {IoChatbubbleEllipsesOutline, IoCheckmarkCircleOutline} from 'react-icons/io5';
import {motion} from 'motion/react';
import Toggle from '../Toggle';

function countToken(content: string) {
    const tokens = content.split(/([^a-zA-Z0-9_-]+)/).filter(v => v.length > 1);
    return tokens.length;
}

function resolveCompleteMessage(content: string) {
    const tokenCount = countToken(content);
    if (tokenCount < 500) {
        return 'Easy problem easy go';
    }
    if (tokenCount < 1000) {
        return 'Quite a chanllenge';
    }
    return 'Struggled and finally';
}

const MotionPendingIcon = motion.create(IoChatbubbleEllipsesOutline);

const MotionCompleteIcon = motion.create(IoCheckmarkCircleOutline);

function PendingIcon() {
    return (
        <MotionPendingIcon
            initial={{opacity: 0}}
            animate={{opacity: [1, 0.5, 1]}}
            transition={{duration: 2, repeat: Infinity}}
        />
    );
}

function CompleteIcon() {
    return (
        <MotionCompleteIcon
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{duration: 1, ease: 'backOut'}}
        />
    );
}

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Content = styled.div`
    white-space: pre-wrap;
    color: var(--color-secondary-foreground);
    border-left: 2px solid var(--color-default-border);
    padding-left: .5em;
    margin-top: .5em;
    margin-left: .5em;
`;

const Layout = styled.div`
    font-size: .8em;
`;

interface Props {
    content: string;
    running: boolean;
}

export default function Reasoning({content, running}: Props) {
    const [pendingMessage, setPendingMessage] = useState('Oniichan is glancing over the problem...');
    const [collapsed, setCollapsed] = useState(true);
    useEffect(
        () => {
            if (!running) {
                return;
            }

            const shortTimer = setTimeout(
                () => setPendingMessage('Oniichan is thinking hard for a solution...'),
                5000
            );
            const longTimer = setTimeout(
                () => setPendingMessage('Oniichan is burning his brain...'),
                20000
            );

            return () => {
                clearTimeout(shortTimer);
                clearTimeout(longTimer);
            };
        },
        [closed]
    );

    return (
        <Layout>
            <Bar>
                {running ? <PendingIcon /> : <CompleteIcon />}
                {running ? pendingMessage : resolveCompleteMessage(content)}
                <Toggle collapsed={collapsed} onChange={setCollapsed} />
            </Bar>
            {!collapsed && <Content>{content.trim()}</Content>}
        </Layout>
    );
}
