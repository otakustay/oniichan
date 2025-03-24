import styled from '@emotion/styled';
import {IoTerminalOutline, IoCheckmarkSharp, IoClose} from 'react-icons/io5';
import type {WorkflowSourceChunkStatus, WorkflowChunkStatus} from '@oniichan/shared/inbox';
import {useApproveTool} from '@oniichan/web-host/atoms/inbox';
import {stringifyError} from '@oniichan/shared/error';
import {useMessageIdentity} from '../MessageContext';
import Button from '@/components/Button';
import {showToast} from '@/components/Toast';
import InteractiveLabel from '@/components/InteractiveLabel';
import LoadingIcon from '@/components/LoadingIcon';

const Header = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: .5em;
    height: 2.5em;
    padding: 0 1em;
    border-bottom: none;
`;

const Code = styled.pre`
    color: unset;
    padding: .5em;
    margin: 0;
    background-color: var(--color-contrast-background);
    border-radius: .5em;
    white-space: pre-wrap;
    word-break: break-all;
`;

const Body = styled.div`
    padding: 1em;
    padding-top: 0;
`;

const ActionButton = styled(Button)`
    height: 2em;
    border-radius: .3em;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 1em;
    padding: 0 1em .5em;
`;

const Layout = styled.div`
    margin: 1em 0;
    border: 1px solid var(--color-default-border);
    border-radius: .5em;

    + & {
        margin-top: 0;
    }
`;

function renderIcon(status: WorkflowSourceChunkStatus | WorkflowChunkStatus) {
    switch (status) {
        case 'generating':
        case 'waitingValidate':
        case 'validated':
        case 'waitingApprove':
        case 'userApproved':
        case 'executing':
            return <LoadingIcon />;
        case 'userRejected':
        case 'failed':
        case 'validateError':
            return <IoClose />;
        case 'completed':
            return <IoCheckmarkSharp />;
        default:
            return null;
    }
}

interface Props {
    command: string;
    status: WorkflowSourceChunkStatus | WorkflowChunkStatus;
}

export default function CommandRun({command, status}: Props) {
    const {threadUuid, messageUuid} = useMessageIdentity();
    const approveTool = useApproveTool(threadUuid, messageUuid);
    const approve = async (approved: boolean) => {
        try {
            await approveTool(crypto.randomUUID(), approved);
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
    };
    const renderFooter = () => {
        if (status === 'waitingApprove') {
            return (
                <Footer>
                    <InteractiveLabel onClick={() => approve(false)}>Skip</InteractiveLabel>
                    <ActionButton onClick={() => approve(true)}>Run</ActionButton>
                </Footer>
            );
        }
        return null;
    };

    return (
        <Layout>
            <Header>
                <IoTerminalOutline />
                Run Command
                {renderIcon(status)}
            </Header>
            <Body>
                <Code>{command}</Code>
            </Body>
            {renderFooter()}
        </Layout>
    );
}
