import {useEffect, useState} from 'react';
import styled from '@emotion/styled';
import {IoAlertCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {FileEditData} from '@oniichan/shared/inbox';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';

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
    const editType = edit?.type ?? 'none';
    const expectedFileContent = edit && edit.type !== 'error' ? edit.oldContent : '';
    // TODO: Validate file modification before edit action is shown to user
    const [check, setCheck] = useState<ApplyCheckState>({state: 'reading', appliable: false});
    const ipc = useIpc();
    useEffect(
        () => {
            if (editType === 'none') {
                return;
            }

            void (async () => {
                try {
                    if (editType === 'error') {
                        setCheck({state: 'success', appliable: true});
                        return;
                    }

                    const content = await ipc.editor.call(crypto.randomUUID(), 'readWorkspaceFile', file);
                    // We allow to apply an edit in some cases even if the file is not modified:
                    //
                    // 1. To create a file, it already exists but its content is empty
                    // 2. To write a file with full content, the original file has been deleted
                    // 3. To modify a file, the file content has different heading and trailing whitespace
                    // 4. To delete a file, but it has been modified, this means all delete actions are appliable
                    if (editType === 'create') {
                        setCheck({state: 'success', appliable: !content});
                    }
                    else if (editType === 'edit') {
                        const appliable = content === null || content.trim() === expectedFileContent.trim();
                        setCheck({state: 'success', appliable});
                    }
                    else {
                        setCheck({state: 'success', appliable: true});
                    }
                }
                catch {
                    setCheck({state: 'fail', appliable: false});
                }
            })();
        },
        [ipc, file, editType, expectedFileContent]
    );
    const extension = file.split('.').pop();
    const openDiffView = async () => {
        if (edit && edit.type !== 'error') {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', edit);
        }
    };
    const accept = async () => {
        if (edit && edit.type !== 'error') {
            await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', edit);
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
                    {check.state === 'reading' && <ActBar.Loading />}
                    {check.appliable && <ActionButton onClick={openDiffView}>Open Diff</ActionButton>}
                    {check.appliable && <ActionButton onClick={accept}>Accept</ActionButton>}
                    {!check.appliable && <ErrorSign title="Expand to get detail">Errored</ErrorSign>}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
