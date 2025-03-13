import styled from '@emotion/styled';
import type {MessageViewChunk} from '@oniichan/shared/inbox';

function resolveTextFromChunk(chunk: MessageViewChunk | null): string {
    if (chunk?.type === 'toolCall') {
        switch (chunk.toolName) {
            case 'read_file':
            case 'read_directory':
            case 'find_files_by_glob':
            case 'find_files_by_regex':
                return 'Oniichan is analyzing your project...';
            case 'write_file':
            case 'patch_file':
            case 'delete_file':
                return 'Oniichan is coding...';
            case 'run_command':
                return 'Oniichan is waiting for command...';
        }
    }

    return 'Oniichan is thinking...';
}

const Layout = styled.div`
    margin-top: 1em;
    font-size: .8em;
	color: transparent;
    background: linear-gradient(
        to right,
        var(--color-secondary-foreground) 0%,
        var(--color-default-background) 50%,
        var(--color-secondary-foreground) 100%
    );
    background-color: var(--color-secondary-foreground);
    background-repeat: no-repeat;
	background-size: 30%;
	background-clip: text;
    animation: shine 4s linear infinite;

    @keyframes shine {
        0% {
            background-position: -100%;
        }
        50% {
            background-position: -30%;
        }
        100% {
            background-position: 30%;
        }
    }
`;

interface Props {
    chunk: MessageViewChunk | null;
}

export default function Indicator({chunk}: Props) {
    return (
        <Layout>
            {resolveTextFromChunk(chunk)}
        </Layout>
    );
}
