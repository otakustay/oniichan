import styled from '@emotion/styled';
import {MessageViewChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';
import {EmbeddingSearch} from './EmbeddingSearch';
import Thinking from './Thinking';

function renderChunk(chunk: MessageViewChunk, index: number, dataSource: MessageViewChunk[]) {
    if (typeof chunk === 'string') {
        return chunk.trim() ? <Markdown key={`string-chunk-${index}`} content={chunk} /> : null;
    }
    else if (chunk.type === 'thinking') {
        return process.env.NODE_ENV === 'development' || index === dataSource.length - 1
            ? <Thinking key={`thinking-chunk-${index}`} content={chunk.content} />
            : null;
    }
    else if (chunk.type === 'toolCall') {
        return <ToolUsage key={`tool-chunk-${index}`} input={chunk} />;
    }
    else if (chunk.type === 'plainText') {
        return <pre key={`plain-text-chunk-${index}`}>{chunk.content}</pre>;
    }
    else {
        return <EmbeddingSearch key={`embedding-chunk-${index}`} query={chunk.query} results={chunk.results} />;
    }
}

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
    const chunks = Array.isArray(content) ? content : [content];

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <Layout className={className}>{chunks.map(renderChunk)}</Layout>;
}
