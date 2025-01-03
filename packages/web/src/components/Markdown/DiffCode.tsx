import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {AiOutlineLoading3Quarters} from 'react-icons/ai';
import {diffLines} from 'diff';
import {trimPathString} from '@oniichan/shared/string';
import {useIpc} from '@/components/AppProvider';
import Button from '@/components/Button';
import LanguageIcon from './LanguageIcon';

const Loading = styled(AiOutlineLoading3Quarters)`
    animation: spin 1s linear infinite;
    font-size: .8em;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

interface CountLabelProps {
    type: 'addition' | 'deletion';
    count: number;
}

function CountLabel({type, count}: CountLabelProps) {
    if (!count) {
        return null;
    }

    const color = type === 'addition' ? 'var(--color-addition)' : 'var(--color-deletion)';
    return <span style={{color}}>{type === 'addition' ? '+' : '-'}{count}</span>;
}

const ActionButton = styled(Button)`
    height: 1.5em;
    border-radius: .5em;
`;

const Layout = styled.div`
    padding: .5em 1em;
    border: solid 1px var(--color-default-border);
    display: flex;
    align-items: center;
    gap: .5em;
    border-radius: .5em;
    background-color: var(--color-contrast-background);
`;

interface Props {
    file: string;
    code: string;
    language: string | undefined;
    closed: boolean;
}

export default function DiffCode({file, code, language, closed}: Props) {
    const [rawText, setRawText] = useState<string | null>(null);
    const ipc = useIpc();
    useEffect(
        () => {
            void (async () => {
                const content = await ipc.editor.call(crypto.randomUUID(), 'readWorkspaceFile', file);
                setRawText(content);
            })();
        },
        [ipc, file]
    );
    const changes = diffLines(rawText || '', code);
    const addition = changes.reduce((s, v) => s + (v.added ? v.count ?? 1 : 0), 0);
    const deletion = changes.reduce((s, v) => s + (v.removed ? v.count ?? 1 : 0), 0);
    const openDiffView = async () => {
        const request = {
            file,
            oldContent: rawText ?? '',
            newContent: code,
        };
        await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', request);
    };
    const accept = async () => {
        const request = {
            file,
            action: 'modify',
            content: code,
        } as const;
        await ipc.editor.call(crypto.randomUUID(), 'acceptEdit', request);
    };

    return (
        <Layout>
            {closed ? <LanguageIcon language={language ?? ''} /> : <Loading />}
            {trimPathString(file)}
            <CountLabel type="addition" count={addition} />
            <CountLabel type="deletion" count={deletion} />
            {closed && <ActionButton style={{marginLeft: 'auto'}} onClick={openDiffView}>Open Diff</ActionButton>}
            {closed && <ActionButton onClick={accept}>Accept</ActionButton>}
        </Layout>
    );
}
