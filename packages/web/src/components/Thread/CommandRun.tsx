import styled from '@emotion/styled';
import {IoTerminalOutline, IoCheckmarkSharp} from 'react-icons/io5';
import {ToolCallChunkStatus} from '@oniichan/shared/inbox';
import {useApproveTool} from '@oniichan/web-host/atoms/inbox';
import {stringifyError} from '@oniichan/shared/error';
import Button from '@/components/Button';
import ActBar from '@/components/ActBar';
import {useMessageIdentity} from './MessageContext';
import {showToast} from '@/components/Toast';

const Code = styled.code`
    color: unset;
`;

interface Props {
    command: string;
    status: ToolCallChunkStatus;
}

export default function CommandRun({command, status}: Props) {
    const {threadUuid, messageUuid} = useMessageIdentity();
    const approveTool = useApproveTool(threadUuid, messageUuid);
    const approve = async () => {
        try {
            await approveTool(crypto.randomUUID());
        }
        catch (ex) {
            showToast('error', stringifyError(ex), {timeout: 3000});
        }
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
