import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import styled from '@emotion/styled';
import {useIpc} from '@/components/AppProvider';
import InteractiveLabel from '@/components/InteractiveLabel';
import {showToast} from '@/components/Toast';

const FileLabel = styled(InteractiveLabel)`
    padding: 0 .5em;
`;

interface FileLinkProps {
    file: string;
}

function FileLink({file}: FileLinkProps) {
    const [isLink, setIsLink] = useState(false);
    const ipc = useIpc();
    const open = async () => {
        try {
            await ipc.editor.call(crypto.randomUUID(), 'openDocument', file);
        }
        catch {
            showToast('error', 'Unable to open file', {timeout: 2000});
        }
    };
    useEffect(
        () => {
            void (async () => {
                const exists = await ipc.editor.call(crypto.randomUUID(), 'checkFileExists', file);
                setIsLink(exists);
            })();
        },
        [file]
    );

    if (isLink) {
        return <FileLabel onClick={open}>{file}</FileLabel>;
    }

    return <code>{file}</code>;
}

interface Props {
    className?: string;
    children: ReactNode;
}

export default function InlineCode({className, children}: Props) {
    if (!className && typeof children === 'string' && /^\S+\/[\S/]+$/.test(children)) {
        return <FileLink file={children} />;
    }

    return <code className={className}>{children}</code>;
}
