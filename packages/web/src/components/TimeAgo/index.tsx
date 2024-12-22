import {useEffect, useState} from 'react';

interface Props {
    className?: string;
    time: Date | string;
}

function formatTimeSpan(date: Date, now: Date) {
    const ms = now.getTime() - date.getTime();

    if (ms < 60000) {
        return '刚刚';
    }
    if (ms < 3600000) {
        return `${Math.floor(ms / 60000)}分钟前`;
    }
    if (ms < 86400000) {
        return date.toLocaleTimeString('default', {hour: 'numeric', minute: '2-digit'});
    }
    return date.toLocaleDateString();
}

export function TimeAgo({className, time}: Props) {
    const [now, setNow] = useState(new Date());
    const date = new Date(time);
    useEffect(
        () => {
            const timer = setInterval(() => setNow(new Date()), 10000);
            return () => clearInterval(timer);
        },
        []
    );

    return <time className={className} dateTime={date.toISOString()}>{formatTimeSpan(date, now)}</time>;
}
