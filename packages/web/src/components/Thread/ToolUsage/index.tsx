import type {ToolCallMessageChunk, ParsedToolCallMessageChunk} from '@oniichan/shared/inbox';
import TextToolUsage from './TextToolUsage';
import ParsedToolUsage from './ParsedToolUsage';

interface Props {
    input: ToolCallMessageChunk | ParsedToolCallMessageChunk;
}

export default function ToolUsage({input}: Props) {
    return input.type === 'toolCall' ? <TextToolUsage input={input} /> : <ParsedToolUsage input={input} />;
}
