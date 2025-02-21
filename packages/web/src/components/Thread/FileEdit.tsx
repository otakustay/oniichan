import styled from '@emotion/styled';
import {IoAlertCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {stringifyError} from '@oniichan/shared/error';
import {FileEditData} from '@oniichan/shared/patch';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import InteractiveLabel from '@/components/InteractiveLabel';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {showToast} from '@/components/Toast';
import {useIsEditInteractive, useMergedFileEdit} from './FileEditContext';
import CountLabel from './CountLabel';

const ErrorLabel = styled.div`
    color: var(--color-error);
    padding-top: .5em;
    white-space: pre-wrap;
`;

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

export type EditAction = 'write' | 'patch' | 'delete';

interface Props {
    file: string;
    patch: string;
    edit: FileEditData | null;
}

export default function FileEdit({file, patch, edit}: Props) {
    const viewMode = useViewModeValue();
    const ipc = useIpc();
    const mergedEdit = useMergedFileEdit(file);
    const isEditInteractive = useIsEditInteractive();
    const extension = file.split('.').pop();
    const openDiffView = async () => {
        if (!mergedEdit || mergedEdit.type === 'error') {
            showToast('error', 'This patch is errored', {timeout: 3000});
            return;
        }

        try {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', mergedEdit);
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const renderDetail = () => {
        const error = mergedEdit?.type === 'error' ? mergedEdit.message : '';
        const content = patch.trim();

        if (error || (viewMode.debug && content)) {
            return (
                <>
                    {error && <ErrorLabel>{error}</ErrorLabel>}
                    <SourceCode code={content} language="text" />
                </>
            );
        }

        return null;
    };
    // Count labels represents for current single edit, not merged
    const codeEdit = (!edit || edit.type === 'error') ? null : edit;
    // Review always open a diff with merged edit
    const showAction = isEditInteractive && mergedEdit?.type !== 'error';

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
                    {!edit && <ActBar.Loading />}
                    {showAction && <InteractiveLabel onClick={openDiffView}>Review</InteractiveLabel>}
                    {mergedEdit?.type === 'error' && <ErrorSign title="Expand to get detail" />}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
