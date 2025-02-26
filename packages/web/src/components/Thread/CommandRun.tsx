import styled from '@emotion/styled';
import {IoTerminalOutline, IoCheckmarkSharp} from 'react-icons/io5';
import {ToolCallChunkStatus} from '@oniichan/shared/inbox';
import {useIpc} from '@/components/AppProvider';
import Button from '@/components/Button';
import ActBar from '../ActBar';
import {useMessageIdentity} from './MessageContext';

const Code = styled.code`
    color: unset;
`;

interface Props {
    command: string;
    status: ToolCallChunkStatus;
}

export default function CommandRun({command, status}: Props) {
    const {threadUuid, messageUuid} = useMessageIdentity();
    const ipc = useIpc();
    const approve = async () => {
        // TODO: Stream update UI
        await ipc.kernel.call(crypto.randomUUID(), 'inboxApproveTool', {threadUuid, requestMessageUuid: messageUuid});
    };

    // TODO: Beautify it
    return (
        <ActBar.Titled
            titleIcon={<IoTerminalOutline />}
            statusIcon={status === 'completed' ? <IoCheckmarkSharp /> : <ActBar.Loading />}
            title="Run Command"
            content={
                <>
                    <Code>{command}</Code>
                    {status === 'waitingApprove' && <Button onClick={approve}>Continue</Button>}
                </>
            }
        />
    );
}
