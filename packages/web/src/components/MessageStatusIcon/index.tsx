import {createElement} from 'react';
import {FaCircle, FaDownload} from 'react-icons/fa';
import {css} from '@emotion/css';
import {Message} from '@/atoms/inbox';

const className = css`
    color: var(--color-information);
    width: .8em;
    height: .8em;
`;

interface Props {
    status: Message['status'];
}

export default function MessageStatusIcon({status}: Props) {
    if (status === 'read') {
        return null;
    }

    const icon = status === 'generating' ? FaDownload : FaCircle;
    return createElement(icon, {className});
}
