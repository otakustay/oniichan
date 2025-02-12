import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {AiOutlineLoading3Quarters} from 'react-icons/ai';
import {DiffAction, DiffSummary, applyDiff, summarizeDiff} from '@oniichan/shared/diff';
import {trimPathString} from '@oniichan/shared/string';
import {RenderDiffViewRequest, AcceptEditRequest} from '@oniichan/editor-host/protocol';
import {useIpc} from '@/components/AppProvider';
import Button from '@/components/Button';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';

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

const ErrorLabel = styled.span`
    margin-left: auto;
    color: var(--color-error);
`;

interface SourceFileState {
    state: 'reading' | 'success' | 'fail' | 'notFound';
    content: string;
}

interface ViewState extends DiffSummary {
    showAction: boolean;
    error: string;
    newContent: string;
}

function computeState(closed: boolean, action: DiffAction, source: SourceFileState, generated: string): ViewState {
    if (!closed || source.state === 'reading') {
        const summary = summarizeDiff(action, source.content, generated);
        return {
            showAction: false,
            error: '',
            newContent: '',
            ...summary,
        };
    }
    if (source.state === 'notFound' && action !== 'create') {
        const summary = summarizeDiff(action, source.content, generated);
        return {
            showAction: false,
            error: 'No Source File',
            newContent: '',
            ...summary,
        };
    }
    if (source.state === 'fail') {
        const summary = summarizeDiff(action, source.content, generated);
        return {
            showAction: false,
            error: 'Read Source Failed',
            newContent: '',
            ...summary,
        };
    }
    if (action === 'delete') {
        return {
            showAction: true,
            error: '',
            newContent: '',
            insertedCount: 0,
            deletedCount: 0,
        };
    }

    const applied = applyDiff(action, source.content, generated);
    return {
        showAction: applied.success,
        error: applied.success ? '' : 'Not Appliable',
        newContent: applied.newContent,
        insertedCount: applied.insertedCount,
        deletedCount: applied.deletedCount,
    };
}

interface Props {
    action: DiffAction;
    file: string;
    content: string;
    closed: boolean;
}

export default function DiffCode({action, file, content, closed}: Props) {
    const [sourceFile, setSourceFile] = useState<SourceFileState>({state: 'reading', content: ''});
    const ipc = useIpc();
    useEffect(
        () => {
            void (async () => {
                try {
                    const content = await ipc.editor.call(crypto.randomUUID(), 'readWorkspaceFile', file);
                    setSourceFile({state: content === null ? 'notFound' : 'success', content: content ?? ''});
                }
                catch {
                    setSourceFile({state: 'fail', content: ''});
                }
            })();
        },
        [ipc, file]
    );
    const extension = file.split('.').pop();
    const {showAction, error, newContent, insertedCount, deletedCount} = computeState(
        closed,
        action,
        sourceFile,
        content
    );
    const openDiffView = async () => {
        const request: RenderDiffViewRequest = {
            action,
            file,
            oldContent: sourceFile.content,
            newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', request);
    };
    const accept = async () => {
        const request: AcceptEditRequest = {
            action,
            file,
            newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', request);
    };

    return (
        <ActBar
            icon={<LanguageIcon mode="extension" value={extension} />}
            content={
                <>
                    <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
                    {closed && <CountLabel type="addition" count={insertedCount} />}
                    {closed && <CountLabel type="deletion" count={deletedCount} />}
                    {action === 'delete' && <DeletedMark>D</DeletedMark>}
                </>
            }
            actions={
                <>
                    {!closed && <Loading />}
                    {showAction && <ActionButton onClick={openDiffView}>Open Diff</ActionButton>}
                    {showAction && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {error && <ErrorLabel>{error}</ErrorLabel>}
                </>
            }
            richContent={error && content.trim() ? <SourceCode code={content.trim()} language="diff" /> : null}
        />
    );
}
