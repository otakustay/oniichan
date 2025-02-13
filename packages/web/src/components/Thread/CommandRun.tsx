import styled from '@emotion/styled';
import {IoTerminalOutline, IoCheckmarkSharp} from 'react-icons/io5';
import {ToolCallMessageChunk} from '@oniichan/shared/inbox';
import ActBar from '../ActBar';

const Code = styled.code`
    color: unset;
`;

interface Props {
    command: string;
    status: ToolCallMessageChunk['status'];
}

export default function CommandRun({command, status}: Props) {
    return (
        <ActBar.Titled
            titleIcon={<IoTerminalOutline />}
            statusIcon={status === 'completed' ? <IoCheckmarkSharp /> : <ActBar.Loading />}
            title="Run Command"
            content={<Code>{command}</Code>}
        />
    );
}
