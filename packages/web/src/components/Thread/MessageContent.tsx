import {MessageToolUsage} from '@oniichan/shared/tool';
import Markdown from '@/components/Markdown';
import ToolUsage from './ToolUsage';

interface Props {
    content: string | Array<string | MessageToolUsage>;
}

export default function MessageContent({content}: Props) {
    const chunks = Array.isArray(content) ? content : [content];
    const renderChunk = (chunk: string | MessageToolUsage, index: number) => {
        if (typeof chunk === 'string') {
            return <Markdown key={`string-chunk-${index}`} content={chunk} />;
        }
        return <ToolUsage key={chunk.id} usage={chunk} />;
    };

    if (!chunks.length) {
        return <>(Empty)</>;
    }

    return <>{chunks.map(renderChunk)}</>;
}
