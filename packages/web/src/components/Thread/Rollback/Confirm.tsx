import type {FormEvent} from 'react';
import styled from '@emotion/styled';
import {useHover} from 'huse';
import {IoAlertCircleOutline, IoEyeOutline, IoGitMergeOutline} from 'react-icons/io5';
import type {InboxRollbackCheckItem} from '@oniichan/kernel/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {Description} from './Description';
import InteractiveLabel from '@/components/InteractiveLabel';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import {useIpc} from '@/components/AppProvider';
import {showToast} from '@/components/Toast';

const ConflictSign = styled(IoGitMergeOutline)`
    color: var(--color-error);
`;

const ErrorSign = styled(IoAlertCircleOutline)`
    color: var(--color-error);
`;

const Title = styled.h2`
    padding: 0;
    margin: 0;
`;

const Table = styled.table`
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;

    th,
    td {
        text-align: left;
        font-weight: normal;
        border-bottom: 1px solid var(--color-default-border);
        padding-top: .5em;
    }

    th {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    td:first-of-type {
        width: 1.5em;
    }

    td:last-of-type {
        width: 2em;
    }
`;

const TableContainer = styled.div`
    max-height: 40vh;
    overflow-y: auto;
`;

const SubmitButton = styled(Button)`
    height: 2em;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1em;
    margin-top: 1em;
`;

const Layout = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-width: 640px;
    padding: 1em;
    background: var(--color-default-background);
`;

interface RowProps {
    item: InboxRollbackCheckItem;
}

function Row({item}: RowProps) {
    const [hover, hoverCallbacks] = useHover();
    const ipc = useIpc();
    const openDiffView = async () => {
        if (!item.edit) {
            return;
        }

        try {
            await ipc.editor.call(crypto.randomUUID(), 'renderDiffView', item.edit);
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const renderAction = () => {
        if (hover) {
            return item.edit
                ? (
                    <InteractiveLabel title="Review" onClick={openDiffView}>
                        <IoEyeOutline />
                    </InteractiveLabel>
                )
                : <ErrorSign />;
        }

        if (item.state === 'conflict') {
            return <ConflictSign />;
        }

        if (item.state === 'error') {
            return <ErrorSign />;
        }

        return null;
    };

    return (
        <tr {...hoverCallbacks}>
            <th>{item.file}</th>
            <td>
                {renderAction()}
            </td>
            <td>
                <input
                    type="checkbox"
                    name="confirmed"
                    value={item.file}
                    defaultChecked={item.state === 'appliable'}
                    disabled={!item.edit}
                />
            </td>
        </tr>
    );
}

interface Props {
    affected: InboxRollbackCheckItem[];
    onSubmit: (files: string[]) => void;
    onCancel: () => void;
}

export default function Confirm({affected, onSubmit, onCancel}: Props) {
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const confirmed = formData.getAll('confirmed');
        onSubmit(confirmed.filter(v => typeof v === 'string'));
    };
    return (
        <Modal onClose={onCancel}>
            <Layout>
                <Title>Confirm Rollback</Title>
                <Description affectedCount={affected.length} />
                <form onSubmit={submit}>
                    <TableContainer>
                        <Table>
                            <tbody>
                                {affected.map(v => <Row key={v.file} item={v} />)}
                            </tbody>
                        </Table>
                    </TableContainer>
                    <Footer>
                        <InteractiveLabel onClick={onCancel}>Cancel</InteractiveLabel>
                        <SubmitButton type="submit">Confirm</SubmitButton>
                    </Footer>
                </form>
            </Layout>
        </Modal>
    );
}
