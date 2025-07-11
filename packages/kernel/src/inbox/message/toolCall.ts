import dedent from 'dedent';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {
    ToolCallMessageData,
    ToolCallMessageContentChunk,
    WorkflowChunkStatus,
    ParsedToolCallMessageChunkOf,
} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';
import {assertHasValue} from '@oniichan/shared/error';
import type {InboxRoundtrip, InboxToolCallMessage, ToolCallMessageToChatInpytPayloadOptions} from '../interface.js';
import {MessageBase} from './base.js';
import {chunksToModelText} from './utils.js';

type Name = ToolName;

export class ToolCallMessage<N extends Name = Name> extends MessageBase<'toolCall'> implements InboxToolCallMessage<N> {
    private readonly chunks: ToolCallMessageContentChunk[] = [];

    private readonly role: string;

    static from(data: ToolCallMessageData, roundtrip: InboxRoundtrip) {
        const message = new ToolCallMessage(roundtrip, data);
        return message;
    }

    constructor(roundtrip: InboxRoundtrip, source: ToolCallMessageData) {
        super(source.uuid, 'toolCall', roundtrip);
        this.role = source.role;
        this.restore(source);
    }

    getRole() {
        return this.role;
    }

    toChatInputPayload(options?: ToolCallMessageToChatInpytPayloadOptions): ChatInputPayload {
        const chunk = this.findToolCallChunkStrict();

        if (chunk.toolName === 'create_plan' && options?.hidePlanDetail) {
            return {
                role: 'assistant',
                content: dedent`
                    <create_plan>
                    (A plan with ${chunk.arguments.tasks.length} tasks was generated)
                    </create_plan>
                `,
            };
        }

        return {
            role: 'assistant',
            content: chunksToModelText(this.chunks),
        };
    }

    toMessageData(): ToolCallMessageData {
        return {
            ...this.toMessageDataBase(),
            role: this.role,
            type: this.type,
            chunks: this.chunks,
        };
    }

    findToolCallChunkStrict(): ParsedToolCallMessageChunkOf<N> {
        const chunk = this.chunks.find(v => v.type === 'parsedToolCall');
        assertHasValue(chunk, 'Invalid tool call message without tool chunk');
        return chunk as ParsedToolCallMessageChunkOf<N>;
    }

    getWorkflowOriginStatus(): WorkflowChunkStatus {
        const chunk = this.findToolCallChunkStrict();
        return chunk.status;
    }

    markWorkflowOriginStatus(status: WorkflowChunkStatus) {
        const chunk = this.findToolCallChunkStrict();
        chunk.status = status;
    }

    protected restore(persistData: ToolCallMessageData) {
        super.restore(persistData);
        this.chunks.push(...persistData.chunks);
    }
}
