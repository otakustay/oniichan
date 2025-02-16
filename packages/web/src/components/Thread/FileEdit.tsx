import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {useOriginalCopy} from 'huse';
import {IoAlertCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {FileEditData} from '@oniichan/shared/inbox';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {showToast} from '@/components/Toast';
import {stringifyError} from '@oniichan/shared/error';

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

interface ApplyCheckState {
    state: 'reading' | 'success' | 'fail';
    appliable: boolean;
}

export type EditAction = 'write' | 'patch' | 'delete';

interface Props {
    file: string;
    patch: string;
    edit: FileEditData | null;
}

export default function FileEdit({file, edit, patch}: Props) {
    const viewMode = useViewModeValue();
    const editForCheck = useOriginalCopy(edit);
    const [check, setCheck] = useState<ApplyCheckState>({state: 'reading', appliable: false});
    const ipc = useIpc();
    useEffect(
        () => {
            if (!editForCheck) {
                return;
            }

            void (async () => {
                try {
                    const appliable = await ipc.editor.call(crypto.randomUUID(), 'checkEditAppliable', editForCheck);
                    setCheck({state: 'success', appliable});
                }
                catch {
                    setCheck({state: 'fail', appliable: false});
                }
            })();
        },
        [ipc, editForCheck]
    );
    const extension = file.split('.').pop();
    const openDiffView = async () => {
        if (!edit || edit.type === 'error') {
            return;
        }

        try {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', edit);
        }
        catch (ex) {
            setCheck({state: 'success', appliable: false});
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const accept = async () => {
        if (!edit || edit.type === 'error') {
            return;
        }

        try {
            await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', edit);
        }
        catch (ex) {
            setCheck({state: 'success', appliable: false});
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const renderDetail = () => {
        const error = edit?.type === 'error' ? edit.message : (check.appliable ? '' : 'This patch is not appliable');
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
    const hasError = check.state !== 'reading' && !check.appliable;

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
                    {!edit && <ActBar.Loading />}
                    {check.appliable && <ActionButton onClick={openDiffView}>Review</ActionButton>}
                    {check.appliable && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {hasError && <ErrorSign title="Expand to get detail">Errored</ErrorSign>}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
