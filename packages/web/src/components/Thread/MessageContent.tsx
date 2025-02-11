import styled from '@emotion/styled';
import {MessageViewChunk} from '@oniichan/shared/inbox';
import {assertNever} from '@oniichan/shared/error';
import {useViewModeValue} from '@oniichan/web-host/atoms/view';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';
import Thinking from './Thinking';

const Layout = styled.div`
    code {
        font-family: monospace;
        padding: 0 .5em;
        background-color: transparent;
        color: var(--color-contrast-foreground);
    }

    pre {
        background-color: transparent !important;
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
    content: MessageViewChunk | MessageViewChunk[];
}

export default function MessageContent({className, content}: Props) {
    const viewMode = useViewModeValue();
    const chunks = Array.isArray(content) ? content : [content];
    const renderChunk = (chunk: MessageViewChunk, index: number, dataSource: MessageViewChunk[]) => {
        switch (chunk.type) {
            case 'text':
                return chunk.content.trim() ? <Markdown key={`string-chunk-${index}`} content={chunk.content} /> : null;
            case 'thinking':
                return viewMode.debug || index === dataSource.length - 1
                    ? <Thinking key={`thinking-chunk-${index}`} content={chunk.content} />
                    : null;
            case 'toolCall':
                return <ToolUsage key={`tool-chunk-${index}`} input={chunk} />;
            case 'plainText':
                return <pre key={`plain-text-chunk-${index}`}>{chunk.content}</pre>;
            default:
                assertNever<{type: string}>(chunk, v => `Unknown chunk type ${v.type}`);
        }
    };

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <Layout className={className}>{chunks.map(renderChunk)}</Layout>;
}
