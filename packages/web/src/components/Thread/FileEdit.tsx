import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {useOriginalCopy} from 'huse';
import {IoAlertCircleOutline, IoCheckmarkCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {stringifyError} from '@oniichan/shared/error';
import {AppliableState} from '@oniichan/editor-host/protocol';
import {FileEditData} from '@oniichan/shared/inbox';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {showToast} from '@/components/Toast';

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
    const editForCheck = useOriginalCopy(edit);
    const [check, setCheck] = useState<AppliableState | 'reading'>('reading');
    const ipc = useIpc();
    useEffect(
        () => {
            if (!editForCheck) {
                return;
            }

            void (async () => {
                try {
                    const appliable = await ipc.editor.call(crypto.randomUUID(), 'checkEditAppliable', editForCheck);
                    setCheck(appliable);
                }
                catch {
                    setCheck('error');
                }
            })();
        },
        [ipc, editForCheck]
    );
    const extension = file.split('.').pop();
    const invokeDiffAction = async (action: 'renderDiffView' | 'acceptFileEdit') => {
        if (!edit || edit.type === 'error') {
            return;
        }

        try {
            const appliable = await ipc.editor.call(crypto.randomUUID(), action, edit);
            console.log(appliable);
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
    const hasError = check === 'conflict' || check === 'error';

    return (
        <ActBar
            mode="contrast"
            icon={<LanguageIcon mode="extension" value={extension} />}
            content={
                <>
                    <FileNameLabel title={file}>{trimPathString(file)}</FileNameLabel>
                    {edit && edit.type !== 'error' && <CountLabel type="addition" count={edit.insertedCount} />}
                    {edit && edit.type !== 'error' && <CountLabel type="deletion" count={edit.deletedCount} />}
                    {edit && edit.type === 'delete' && <DeletedMark>D</DeletedMark>}
                </>
            }
            actions={
                <>
                    {isLoading && <ActBar.Loading />}
                    {check === 'appliable' && <ActionButton onClick={openDiffView}>Review</ActionButton>}
                    {check === 'appliable' && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {check === 'applied' && <AppliedSign title="Already applied" />}
                    {hasError && <ErrorSign title="Expand to get detail" />}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
