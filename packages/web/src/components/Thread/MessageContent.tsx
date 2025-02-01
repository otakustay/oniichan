import {MessageContentChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';
import {EmbeddingSearch} from './EmbeddingSearch';
import Thinking from './Thinking';

function renderChunk(chunk: MessageContentChunk, index: number, dataSource: MessageContentChunk[]) {
    if (typeof chunk === 'string') {
        return <Markdown key={`string-chunk-${index}`} content={chunk} />;
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

interface Props {
    className?: string;
    content: MessageContentChunk | MessageContentChunk[];
}

export default function MessageContent({className, content}: Props) {
    const chunks = Array.isArray(content) ? content : [content];

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <div className={className}>{chunks.map(renderChunk)}</div>;
}
