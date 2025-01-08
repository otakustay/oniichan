import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {AiOutlineLoading3Quarters} from 'react-icons/ai';
import {DiffAction, summarizeDiff} from '@oniichan/shared/diff';
import {trimPathString} from '@oniichan/shared/string';
import {RenderDiffViewRequest, AcceptEditRequest} from '@oniichan/editor-host/protocol';
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

const FileNameLabel = styled.span`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

const DeletedMark = styled.span`
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-deletion);
`;

const ActionButton = styled(Button)`
    height: 1.5em;
    border-radius: .5em;
    min-width: fit-content;
`;

const Layout = styled.div`
    padding: .5em 1em;
    margin: 1em 0;
    border: solid 1px var(--color-default-border);
    display: flex;
    align-items: center;
    gap: .5em;
    border-radius: .5em;
    background-color: var(--color-contrast-background);

    + & {
        margin-top: 0;
    }
`;

function countDiff(action: DiffAction, input: string) {
    if (action === 'create') {
        return {showCount: true, addition: input.split('\n').length, deletion: 0};
    }
    if (action === 'delete') {
        return {showCount: false, addition: 0, deletion: 0};
    }

    const {insertedCount, deletedCount} = summarizeDiff(input);
    return {showCount: true, addition: insertedCount, deletion: deletedCount};
}

interface Props {
    action: DiffAction;
    file: string;
    content: string;
    closed: boolean;
}

export default function DiffCode({action, file, content, closed}: Props) {
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
    const extension = file.split('.').pop();
    const {showCount, addition, deletion} = countDiff(action, content);
    const openDiffView = async () => {
        const request: RenderDiffViewRequest = {
            action,
            file,
            oldContent: rawText ?? '',
            inputContent: content,
        };
        await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', request);
    };
    const accept = async () => {
        const request: AcceptEditRequest = {
            action,
            file,
            oldContent: rawText ?? '',
            inputContent: content,
        };
        await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', request);
    };

    return (
        <Layout>
            {closed ? <LanguageIcon mode="extension" value={extension} /> : <Loading />}
            <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
            {showCount && <CountLabel type="addition" count={addition} />}
            {showCount && <CountLabel type="deletion" count={deletion} />}
            {action === 'delete' && <DeletedMark>D</DeletedMark>}
            {closed && <ActionButton style={{marginLeft: 'auto'}} onClick={openDiffView}>Open Diff</ActionButton>}
            {closed && <ActionButton onClick={accept}>Accept</ActionButton>}
        </Layout>
    );
}
