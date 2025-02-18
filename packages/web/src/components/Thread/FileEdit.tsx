import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {IoAlertCircleOutline, IoCheckmarkCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {stringifyError} from '@oniichan/shared/error';
import {AppliableState} from '@oniichan/editor-host/protocol';
import {FileEditData} from '@oniichan/shared/patch';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {showToast} from '@/components/Toast';
import {useFileEditStack, useIsEditInteractive} from './FileEditContext';
import {useOriginalCopy} from 'huse';

const {ActionButton} = ActBar;

const ErrorLabel = styled.div`
    color: var(--color-error);
    padding-top: .5em;
    white-space: pre-wrap;
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

const ErrorSign = styled(IoAlertCircleOutline)`
    color: var(--color-error);
`;

const AppliedSign = styled(IoCheckmarkCircleOutline)`
    color: var(--color-success);
`;

export type EditAction = 'write' | 'patch' | 'delete';

interface Props {
    file: string;
    patch: string;
    edit: FileEditData | null;
}

export default function FileEdit({file, edit, patch}: Props) {
    const viewMode = useViewModeValue();
    const [check, setCheck] = useState<AppliableState | 'reading'>('reading');
    const ipc = useIpc();
    const editForCheck = useOriginalCopy(edit);
    const editStack = useFileEditStack(file);
    const isEditInteractive = useIsEditInteractive();
    useEffect(
        () => {
            if (!editForCheck || !editStack.length) {
                return;
            }

            void (async () => {
                try {
                    const appliable = await ipc.editor.call(crypto.randomUUID(), 'checkEditAppliable', editStack);
                    setCheck(appliable);
                }
                catch {
                    setCheck('error');
                }
            })();
        },
        [ipc, editForCheck, editStack]
    );
    const extension = file.split('.').pop();
    const invokeDiffAction = async (action: 'renderDiffView' | 'acceptFileEdit') => {
        try {
            const appliable = await ipc.editor.call(crypto.randomUUID(), action, editStack);
            setCheck(appliable);
            switch (appliable) {
                case 'applied':
                    showToast('information', 'This patch is already applied', {timeout: 3000});
                    break;
                case 'conflict':
                    showToast('error', 'This patch is not appliable to file', {timeout: 3000});
                    break;
                case 'error':
                    showToast('error', 'An unexpected error occured while applying patch to file', {timeout: 3000});
            }
        }
        catch (ex) {
            setCheck('error');
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const openDiffView = async () => invokeDiffAction('renderDiffView');
    const accept = async () => invokeDiffAction('acceptFileEdit');
    const renderDetail = () => {
        const error = edit?.type === 'error'
            ? edit.message
            : (check === 'conflict' ? 'This patch is not appliable' : '');
        const content = patch.trim();

        if (viewMode.debug || error || content) {
            return (
                <>
                    {error && <ErrorLabel>{error}</ErrorLabel>}
                    <SourceCode code={content} language="text" />
                </>
            );
        }

        return null;
    };
    const isLoading = !edit || check === 'reading';
    const codeEdit = (!edit || edit.type === 'error' || edit.type === 'patchError') ? null : edit;
    const hasError = check === 'conflict' || check === 'error';
    const showButton = isEditInteractive && check === 'appliable';
    const showApplied = isEditInteractive && check === 'applied';

    return (
        <ActBar
            mode="contrast"
            icon={<LanguageIcon mode="extension" value={extension} />}
            content={
                <>
                    <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
                    {codeEdit && <CountLabel type="addition" count={codeEdit.insertedCount} />}
                    {codeEdit && <CountLabel type="deletion" count={codeEdit.deletedCount} />}
                    {codeEdit?.type === 'delete' && <DeletedMark>D</DeletedMark>}
                </>
            }
            actions={
                <>
                    {isLoading && <ActBar.Loading />}
                    {showButton && <ActionButton onClick={openDiffView}>Review</ActionButton>}
                    {showButton && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {showApplied && <AppliedSign title="Already applied" />}
                    {hasError && <ErrorSign title="Expand to get detail" />}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
