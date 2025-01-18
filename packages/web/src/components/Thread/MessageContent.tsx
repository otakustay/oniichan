import {ToolCallMessageChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';

function renderChunk(chunk: string | ToolCallMessageChunk, index: number) {
    if (typeof chunk === 'string') {
        return <Markdown key={`string-chunk-${index}`} content={chunk} />;
    }
    return <ToolUsage key={`tool-chunk-${index}`} input={chunk} />;
}

interface Props {
    content: string | Array<string | ToolCallMessageChunk>;
}

export default function MessageContent({content}: Props) {
    const chunks = Array.isArray(content) ? content : [content];

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <>{chunks.map(renderChunk)}</>;
}
