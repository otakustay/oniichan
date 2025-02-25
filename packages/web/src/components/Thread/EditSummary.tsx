import styled from '@emotion/styled';
import {VscFile, VscNewFile, VscDiffSingle, VscTrash, VscReport} from 'react-icons/vsc';
import {IoCheckmarkSharp, IoCloseSharp, IoEyeOutline} from 'react-icons/io5';
import {stringifyError} from '@oniichan/shared/error';
import {FileEditData, FileEditResult} from '@oniichan/shared/patch';
import InteractiveLabel from '@/components/InteractiveLabel';
import {useIpc} from '@/components/AppProvider';
import {showToast} from '@/components/Toast';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import {useAllMergedFileEdits} from './FileEditContext';
import CountLabel from './CountLabel';
import Message from './Message';

const ErrorSign = styled(VscReport)`
    color: var(--color-error);
`;

const FileNameLabel = styled.span`
    font-weight: bold;
`;

const FilePathLabel = styled.span`
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    color: var(--color-secondary-foreground);
`;

const CountSection = styled.div`
    display: inline-flex;
    align-items: center;
    gap: .5em;
`;

const ActionSection = styled.div`
    display: none;
    align-items: center;
    gap: .1em;
`;

const Action = styled.i`
    color: var(--color-secondary-foreground);
    padding: .2em;
    border-radius: .3em;
    cursor: pointer;

    &:hover {
        background-color: var(--color-default-background);
        color: var(--color-link-foreground)
    }
`;

const HeaderActionSection = styled.div`
    display: flex;
    gap: 1em;
    margin-left: auto;
`;

const HeaderButton = styled(Button)`
    height: 1.5em;
    border-radius: .5em;
`;

const ItemLayout = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
    height: 2em;
    padding: 0 .5em;
    line-height: 1;
    border-radius: .5em;
    cursor: default;

    &:hover {
        background-color: var(--color-contrast-background);

        ${CountSection} {
            display: none;
        }

        ${ActionSection} {
            display: inline-flex;
        }
    }
`;

interface EditResultViewProps {
    edit: FileEditResult;
}

function EditResultView({edit}: EditResultViewProps) {
    const ipc = useIpc();
    const openDiffView = async () => {
        try {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', edit);
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const requestAccept = async (revert: boolean) => {
        try {
            await ipc.editor.call(crypto.randomUUID(), 'acceptFileEdit', {edit, revert});
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };

    return (
        <>
            <CountSection>
                <CountLabel type="addition" count={edit.insertedCount} />
                <CountLabel type="deletion" count={edit.deletedCount} />
            </CountSection>
            <ActionSection>
                <Action title="Reject" onClick={() => requestAccept(true)}>
                    <IoCloseSharp />
                </Action>
                <Action title="Accept" onClick={() => requestAccept(false)}>
                    <IoCheckmarkSharp />
                </Action>
                <Action title="Review" onClick={openDiffView}>
                    <IoEyeOutline />
                </Action>
            </ActionSection>
        </>
    );
}

interface ItemProps {
    edit: FileEditData;
}

function Item({edit}: ItemProps) {
    const renderTypeLabel = () => {
        switch (edit?.type) {
            case 'error':
                return <ErrorSign />;
            case 'create':
                return <VscNewFile />;
            case 'delete':
                return <VscTrash />;
            case 'edit':
                return <VscDiffSingle />;
            default:
                return <VscFile />;
        }
    };

    return (
        <ItemLayout>
            {renderTypeLabel()}
            <FileNameLabel>{edit.file.split(/\/|\\/).pop() ?? 'unknown file'}</FileNameLabel>
            <FilePathLabel title={edit.file}>{edit.file}</FilePathLabel>
            {edit && edit.type !== 'error' && <EditResultView edit={edit} />}
        </ItemLayout>
    );
}

const Layout = styled(Message.Layout)`
    position: sticky;
    top: 0;
    box-shadow: 0 .5em 1em rgba(0, 0, 0, .1);
    z-index: 1;
`;

export function EditSummary() {
    const edits = useAllMergedFileEdits();
    const ipc = useIpc();
    const requestAcceptAll = async (revert: boolean) => {
        const appliable = edits.filter(v => v.type !== 'error');
        const taskId = crypto.randomUUID();
        const request = async (edit: FileEditResult) => {
            await ipc.editor.call(taskId, 'acceptFileEdit', {edit, revert});
        };
        try {
            await Promise.all(appliable.map(request));
            const remaining = edits.length - appliable.length;
            if (remaining) {
                showToast(
                    'warn',
                    `${remaining} ${remaining === 1 ? 'file is' : 'files are'} not applied`,
                    {timeout: 3000}
                );
            }
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };

    if (!edits.length) {
        return null;
    }

    return (
        <Layout
            compact
            avatar={<Avatar.Tool size="1.5em" />}
            authorName="Review"
            headerAddition={
                <HeaderActionSection>
                    <InteractiveLabel onClick={() => requestAcceptAll(true)}>Reject</InteractiveLabel>
                    <HeaderButton onClick={() => requestAcceptAll(false)}>Accept</HeaderButton>
                </HeaderActionSection>
            }
            body={edits.map(v => <Item key={v.file} edit={v} />)}
        />
    );
}
