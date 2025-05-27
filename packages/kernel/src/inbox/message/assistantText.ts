import {assertHasValue, assertNever} from '@oniichan/shared/error';
import type {ChatInputPayload} from '@oniichan/shared/model';
import {assertToolCallChunk, assertTaggedChunk, chunkToString} from '@oniichan/shared/inbox';
import type {
    AssistantTextMessageData,
    AssistantTextMessageContentChunk,
    MessageInputChunk,
    WorkflowSourceChunkStatus,
    ToolCallMessageChunk,
} from '@oniichan/shared/inbox';
import type {InboxRoundtrip, InboxAssistantTextMessage} from '../interface';
import {MessageBase} from './base';
import {chunksToModelText} from './utils';

export class AssistantTextMessage extends MessageBase<'assistantText'> implements InboxAssistantTextMessage {
    private readonly chunks: AssistantTextMessageContentChunk[] = [];

    private readonly role: string = 'standalone';

    static from(data: AssistantTextMessageData, roundtrip: InboxRoundtrip) {
        const message = new AssistantTextMessage(data.uuid, data.role, roundtrip);
        message.restore(data);
        return message;
    }

    constructor(uuid: string, role: string, roundtrip: InboxRoundtrip) {
        super(uuid, 'assistantText', roundtrip);
        this.role = role;
    }

    addChunk(chunk: MessageInputChunk) {
        // Reasoning chunk should be unique and on top of all chunks
        if (chunk.type === 'reasoning') {
            const firstChunk = this.chunks.at(0);

            if (firstChunk?.type === 'reasoning') {
                firstChunk.content += chunk.content;
            }
            else {
                this.chunks.unshift({type: 'reasoning', content: chunk.content});
            }

            return;
        }

        if (chunk.type === 'text') {
            const lastChunk = this.chunks.at(-1);
            if (lastChunk?.type === 'text') {
                lastChunk.content += chunk.content;
            }
            else {
                this.chunks.push({type: 'text', content: chunk.content});
            }
            return;
        }

        const lastChunk = this.chunks.at(-1);

        if (chunk.type === 'contentStart') {
            this.chunks.push({type: 'content', tagName: chunk.tagName, content: '', status: 'generating'});
        }
        else if (chunk.type === 'toolStart') {
            const toolChunk: ToolCallMessageChunk = {
                type: 'toolCall',
                toolName: chunk.toolName,
                arguments: {},
                status: 'generating',
                source: chunk.source,
            };
            this.chunks.push(toolChunk);
        }
        else if (chunk.type === 'contentDelta') {
            assertTaggedChunk(lastChunk, 'Unexpected thinking delta chunk coming without a start chunk');
            lastChunk.content += chunk.source;
        }
        else if (chunk.type === 'contentEnd') {
            assertTaggedChunk(lastChunk, 'Unexpected thinking end chunk coming without a start chunk');
            lastChunk.status = 'completed';
        }
        else if (chunk.type === 'toolParameterStart') {
            assertToolCallChunk(lastChunk, 'Unexpected tool delta chunk coming without a start chunk');
            lastChunk.source += chunk.source;
            const previousValue = lastChunk.arguments[chunk.parameter];
            if (previousValue === undefined) {
                lastChunk.arguments[chunk.parameter] = '';
            }
            else if (typeof previousValue === 'string') {
                lastChunk.arguments[chunk.parameter] = [previousValue, ''];
            }
            else {
                previousValue.push('');
            }
        }
        else if (chunk.type === 'toolDelta') {
            assertToolCallChunk(lastChunk, 'Unexpected tool delta chunk coming without a start chunk');
            lastChunk.source += chunk.source;
            for (const [key, value] of Object.entries(chunk.arguments)) {
                const previousValue = lastChunk.arguments[key] ?? '';
                if (typeof previousValue === 'string') {
                    lastChunk.arguments[key] = previousValue + value;
                }
                else {
                    previousValue[previousValue.length - 1] += value;
                }
            }
        }
        else if (chunk.type === 'toolEnd') {
            assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
            lastChunk.status = 'waitingValidate';
            lastChunk.source += chunk.source;
            return;
        }
        else if (chunk.type === 'textInTool') {
            assertToolCallChunk(lastChunk, 'Unexpected tool end chunk coming without a start chunk');
            lastChunk.source += chunk.source;
        }
        else {
            assertNever<{type: string}>(chunk, v => `Unexpected chunk type: ${v.type}`);
        }
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'assistant',
            content: chunksToModelText(this.chunks),
        };
    }

    toMessageData(): AssistantTextMessageData {
        return {
            ...this.toMessageDataBase(),
            role: this.role,
            type: this.type,
            chunks: this.chunks,
        };
    }

    getTextContent() {
        return this.chunks.filter(v => v.type !== 'reasoning').map(chunkToString).join('');
    }

    getWorkflowSourceStatus(): WorkflowSourceChunkStatus {
        const chunk = this.findToolCallChunk();
        return chunk?.status ?? 'validated';
    }

    markWorkflowSourceStatus(status: WorkflowSourceChunkStatus) {
        // Tool call
        const chunk = this.findToolCallChunk();
        if (chunk) {
            chunk.status = status;
        }
    }

    findToolCallChunk() {
        return this.chunks.find(v => v.type === 'toolCall') ?? null;
    }

    findToolCallChunkStrict() {
        const chunk = this.findToolCallChunk();
        assertHasValue(chunk, 'Message does not contain tool call chunk');
        return chunk;
    }

    replaceToolCallChunk(newChunk: ToolCallMessageChunk) {
        const index = this.chunks.findIndex(v => v.type === 'toolCall');

        if (index < 0) {
            throw new Error('Invalid tool call message without tool chunk');
        }

        this.chunks[index] = newChunk;
    }

    protected restore(persistData: AssistantTextMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}
