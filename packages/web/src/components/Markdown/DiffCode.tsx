import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {AiOutlineLoading3Quarters} from 'react-icons/ai';
import {DiffAction, applyDiff} from '@oniichan/shared/diff';
import {trimPathString} from '@oniichan/shared/string';
import {RenderDiffViewRequest, AcceptEditRequest} from '@oniichan/editor-host/protocol';
import {useIpc} from '@/components/AppProvider';
import Button from '@/components/Button';
import Toggle from '@/components/Toggle';
import LanguageIcon from './LanguageIcon';
import SourceCode from './SourceCode';

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

const ActionSection = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: .5em;
`;

const ActionButton = styled(Button)`
    height: 1.5em;
    border-radius: .5em;
    min-width: fit-content;
`;

const ErrorLabel = styled.span`
    margin-left: auto;
    color: var(--color-error);
`;

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
`;

const Layout = styled.div`
    padding: .5em 1em;
    margin: 1em 0;
    border: solid 1px var(--color-default-border);
    border-radius: .5em;
    background-color: var(--color-contrast-background);

    + & {
        margin-top: 0;
    }
`;

interface Props {
    action: DiffAction;
    file: string;
    content: string;
    closed: boolean;
}

export default function DiffCode({action, file, content, closed}: Props) {
    const [rawText, setRawText] = useState<string | null>(null);
    const [showSource, setShowSource] = useState(false);
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
    const applied = applyDiff(action, rawText ?? '', content);
    const openDiffView = async () => {
        const request: RenderDiffViewRequest = {
            action,
            file,
            oldContent: rawText ?? '',
            newContent: applied.newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', request);
    };
    const accept = async () => {
        const request: AcceptEditRequest = {
            action,
            file,
            newContent: applied.newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', request);
    };
    const showAction = closed && applied.success;
    const showError = closed && !applied.success;

    return (
        <Layout>
            <Bar>
                {closed ? <LanguageIcon mode="extension" value={extension} /> : <Loading />}
                <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
                <CountLabel type="addition" count={applied.addition} />
                <CountLabel type="deletion" count={applied.deletion} />
                {action === 'delete' && <DeletedMark>D</DeletedMark>}
                <ActionSection>
                    {showAction && <ActionButton onClick={openDiffView}>Open Diff</ActionButton>}
                    {showAction && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {showError && <ErrorLabel>Not Appliable</ErrorLabel>}
                    {showError && <Toggle collapsed={showSource} onChange={setShowSource} />}
                </ActionSection>
            </Bar>
            {showSource && <SourceCode code={content.trim()} language="diff" />}
        </Layout>
    );
}
