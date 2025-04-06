import {useRef, useState} from 'react';
import styled from '@emotion/styled';
import {VscDiscard} from 'react-icons/vsc';
import {countNounSimple} from '@oniichan/shared/string';
import type {InboxRollbackCheckItem, InboxCheckRollbackResponse} from '@oniichan/kernel/protocol';
import {stringifyError} from '@oniichan/shared/error';
import {useIpc} from '@/components/AppProvider';
import {showToast} from '@/components/Toast';
import Confirm from './Confirm';

function renderToastMessage(fileCount: number, roundtripCount: number) {
    if (fileCount && roundtripCount) {
        return `Reverted ${countNounSimple(fileCount, 'file')} in ${countNounSimple(roundtripCount, 'message')}`;
    }

    if (fileCount) {
        return `Reverted ${countNounSimple(fileCount, 'file')}`;
    }

    return `Reverted ${countNounSimple(roundtripCount, 'message')}`;
}

const Icon = styled.span`
    width: 1.5em;
    height: 1.5em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: .3em;
    cursor: pointer;
    color: var(--color-secondary-foreground);

    &:hover {
        background-color: var(--color-contrast-background);
        color: var(--color-link-foreground);
    }
`;

interface Props {
    threadUuid: string;
    messageUuid: string;
}

export default function Rollback({threadUuid, messageUuid}: Props) {
    const [checkResult, setCheckResult] = useState<InboxCheckRollbackResponse | null>(null);
    const taskId = useRef(crypto.randomUUID());
    const ipc = useIpc();
    const commitRollbackMessage = async (affectedCount: number, roundtripCount: number) => {
        try {
            await ipc.kernel.call(taskId.current, 'inboxRollback', {threadUuid, messageUuid});
            showToast(
                'information',
                renderToastMessage(affectedCount, roundtripCount),
                {timeout: 4000}
            );
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
        finally {
            setCheckResult(null);
        }
    };
    const submitRollback = async (files: string[]) => {
        if (!checkResult) {
            return;
        }

        const roundtripCount = checkResult.roundtripCount;
        const affected = (checkResult.affected ?? []).filter(v => files.includes(v.file)).filter(v => !!v.edit);
        const rollbackSingle = async (item: InboxRollbackCheckItem) => {
            // Just a type guard, all items without an edit is already filtered in the code above
            if (!item.edit) {
                return;
            }

            await ipc.editor.call(taskId.current, 'acceptFileEdit', {edit: item.edit, revert: false});
        };

        const results = await Promise.allSettled(affected.map(rollbackSingle));
        const reverted = results.filter(v => v.status === 'fulfilled').length;
        await commitRollbackMessage(reverted, roundtripCount);
    };
    const checkRollback = async () => {
        const result = await ipc.kernel.call(taskId.current, 'inboxCheckRollback', {threadUuid, messageUuid});

        if (result.affected.length) {
            setCheckResult(result);
        }
        else {
            // Immediately rollback message without any file changes
            await commitRollbackMessage(0, result.roundtripCount);
        }
    };
    const renderConfirm = () => {
        if (!checkResult) {
            return null;
        }

        return (
            <Confirm
                affected={checkResult.affected}
                onSubmit={submitRollback}
                onCancel={() => setCheckResult(null)}
            />
        );
    };

    return (
        <>
            <Icon title="Rollback to this message" onClick={checkRollback}>
                <VscDiscard />
            </Icon>
            {renderConfirm()}
        </>
    );
}
