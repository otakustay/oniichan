import {MessageContentChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';
import {EmbeddingSearch} from './EmbeddingSearch';

function renderChunk(chunk: MessageContentChunk, index: number) {
    if (typeof chunk === 'string') {
        return <Markdown key={`string-chunk-${index}`} content={chunk} />;
    }
    else if (chunk.type === 'toolCall') {
        return <ToolUsage key={`tool-chunk-${index}`} input={chunk} />;
    }
    else {
        return <EmbeddingSearch key={`embedding-chunk-${index}`} query={chunk.query} results={chunk.results} />;
    }
}

interface Props {
    className?: string;
    content: string | MessageContentChunk[];
}

export default function MessageContent({className, content}: Props) {
    const chunks = Array.isArray(content) ? content : [content];

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <div className={className}>{chunks.map(renderChunk)}</div>;
}
