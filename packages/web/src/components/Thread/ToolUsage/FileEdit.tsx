import styled from '@emotion/styled';
import {IoAlertCircleOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import {stringifyError} from '@oniichan/shared/error';
import type {FileEditData} from '@oniichan/shared/patch';
import CountLabel from '../CountLabel';
import {useIsEditInteractive} from '../FileEditContext';
import {useIpc} from '@/components/AppProvider';
import ActBar from '@/components/ActBar';
import InteractiveLabel from '@/components/InteractiveLabel';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {showToast} from '@/components/Toast';

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

// Component to display and manage file edits with diff view capabilities
export default function FileEdit({file, patch, edit}: Props) {
    const viewMode = useViewModeValue();
    const ipc = useIpc();
    const isEditInteractive = useIsEditInteractive();
    const extension = file.split('.').pop();
    const codeEdit = (!edit || edit.type === 'error') ? null : edit;

    // Opens a diff view for the current edit
    const openDiffView = async () => {
        if (!codeEdit) {
            showToast('error', 'This patch is errored', {timeout: 3000});
            return;
        }

        try {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', codeEdit);
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };

    // Renders error messages and patch content in debug mode
    const renderDetail = () => {
        const error = edit?.type === 'error' ? edit.message : '';
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

    const showAction = isEditInteractive && codeEdit;

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
                    {edit?.type === 'error' && <ErrorSign title="Expand to get detail" />}
                </>
            }
            richContent={renderDetail()}
        />
    );
}
