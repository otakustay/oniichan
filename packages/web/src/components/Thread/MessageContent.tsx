import styled from '@emotion/styled';
import {MessageViewChunk} from '@oniichan/shared/inbox';
import {assertNever} from '@oniichan/shared/error';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';
import Thinking from './Thinking';
import Reasoning from './Reasoning';

const Layout = styled.div`
    & :where(code) {
        font-family: monospace;
        padding: 0 .5em;
        background-color: transparent;
        color: var(--color-contrast-foreground);
    }

    & :where(pre) {
        background-color: transparent !important;

        code {
            padding: 0;
            color: unset;
        }
    }

    > :first-child {
        margin-top: 0;
    }

    > :last-child {
        margin-bottom: 0;
    }
`;

interface Props {
    className?: string;
    chunks: MessageViewChunk[];
    reasoning: boolean;
}

export default function MessageContent({className, chunks, reasoning}: Props) {
    const viewMode = useViewModeValue();
    const renderChunk = (chunk: MessageViewChunk, index: number, dataSource: MessageViewChunk[]) => {
        switch (chunk.type) {
            case 'reasoning':
                return <Reasoning key={`reasoning-chunk-${index}`} content={chunk.content} running={reasoning} />;
            case 'text':
                return chunk.content.trim() ? <Markdown key={`string-chunk-${index}`} content={chunk.content} /> : null;
            case 'thinking':
                return viewMode.debug || index === dataSource.length - 1
                    ? <Thinking key={`thinking-chunk-${index}`} content={chunk.content} />
                    : null;
            case 'toolCall':
                return <ToolUsage key={`tool-chunk-${index}`} input={chunk} />;
            default:
                assertNever<{type: string}>(chunk, v => `Unknown chunk type ${v.type}`);
        }
    };

    return <Layout className={className}>{chunks.map(renderChunk)}</Layout>;
}
