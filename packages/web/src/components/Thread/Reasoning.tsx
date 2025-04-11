import {useEffect, useState} from 'react';
import {IoChatbubbleEllipsesOutline, IoCheckmarkCircleOutline} from 'react-icons/io5';
import {motion} from 'motion/react';
import ActBar from '../ActBar';

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

interface Props {
    content: string;
    running: boolean;
}

export default function Reasoning({content, running}: Props) {
    const [pendingMessage, setPendingMessage] = useState('Oniichan is glancing over the problem...');
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
        <ActBar.Secondary
            icon={running ? <PendingIcon /> : <CompleteIcon />}
            title={running ? pendingMessage : resolveCompleteMessage(content)}
            content={content.trim()}
        />
    );
}
