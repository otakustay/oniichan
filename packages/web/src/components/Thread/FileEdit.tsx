import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {patchContent} from '@oniichan/shared/patch';
import {trimPathString} from '@oniichan/shared/string';
import {RenderDiffViewRequest, AcceptEditRequest, DiffAction} from '@oniichan/editor-host/protocol';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';

const {ActionButton} = ActBar;

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

const ErrorLabel = styled.span`
    margin-left: auto;
    color: var(--color-error);
`;

interface SourceFileState {
    state: 'reading' | 'success' | 'fail' | 'notFound';
    content: string;
}

interface ViewState {
    diffAction: DiffAction | 'none';
    error: string;
    newContent: string;
    insertedCount: number;
    deletedCount: number;
}

export type EditAction = 'write' | 'patch' | 'delete';

function computeState(closed: boolean, action: EditAction, source: SourceFileState, patch: string): ViewState {
    if (!closed || source.state === 'reading') {
        // Do not waste CPU when source or patch is still generating
        return {
            diffAction: 'none',
            error: '',
            newContent: '',
            insertedCount: 0,
            deletedCount: 0,
        };
    }

    if (source.state === 'notFound' && action !== 'write') {
        return {
            diffAction: 'none',
            error: 'No Source File',
            newContent: '',
            insertedCount: 0,
            deletedCount: 0,
        };
    }

    if (source.state === 'fail') {
        return {
            diffAction: 'none',
            error: 'Read Source Failed',
            newContent: '',
            insertedCount: 0,
            deletedCount: 0,
        };
    }

    if (action === 'delete') {
        return {
            diffAction: 'delete',
            error: '',
            newContent: '',
            insertedCount: 0,
            // Don't show lines count for delete action
            deletedCount: 0,
        };
    }

    if (action === 'write') {
        const content = patch.replaceAll(/^\n|\n$/g, '');
        return {
            diffAction: source.state === 'notFound' ? 'create' : 'diff',
            error: '',
            newContent: content,
            insertedCount: closed ? content.split('\n').length : 0,
            deletedCount: source.state === 'success' ? source.content.split('\n').length : 0,
        };
    }

    try {
        const patched = patchContent(source.content, patch);
        return {
            diffAction: 'diff',
            error: '',
            newContent: patched.newContent,
            insertedCount: patched.insertedCount,
            deletedCount: patched.deletedCount,
        };
    }
    catch {
        return {
            diffAction: 'none',
            error: 'Not Appliable',
            newContent: '',
            insertedCount: 0,
            deletedCount: 0,
        };
    }
}

interface Props {
    action: EditAction;
    file: string;
    patch: string;
    closed: boolean;
}

export default function FileEdit({action, file, patch, closed}: Props) {
    const viewMode = useViewModeValue();
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
    const view = computeState(closed, action, sourceFile, patch);
    const openDiffView = async () => {
        if (view.diffAction === 'none') {
            return;
        }

        const request: RenderDiffViewRequest = {
            action: view.diffAction,
            file,
            oldContent: sourceFile.content,
            newContent: view.newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', request);
    };
    const accept = async () => {
        if (view.diffAction === 'none') {
            return;
        }

        const request: AcceptEditRequest = {
            action: view.diffAction,
            file,
            newContent: view.newContent,
        };
        await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', request);
    };
    const showRichContent = viewMode.debug || (view.error && patch.trim());

    return (
        <ActBar
            mode="contrast"
            icon={<LanguageIcon mode="extension" value={extension} />}
            content={
                <>
                    <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
                    {closed && <CountLabel type="addition" count={view.insertedCount} />}
                    {closed && <CountLabel type="deletion" count={view.deletedCount} />}
                    {action === 'delete' && <DeletedMark>D</DeletedMark>}
                </>
            }
            actions={
                <>
                    {!closed && <ActBar.Loading />}
                    {view.diffAction !== 'none' && <ActionButton onClick={openDiffView}>Open Diff</ActionButton>}
                    {view.diffAction !== 'none' && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {view.error && <ErrorLabel>{view.error}</ErrorLabel>}
                </>
            }
            richContent={showRichContent ? <SourceCode code={patch.trim()} language="diff" /> : null}
        />
    );
}
