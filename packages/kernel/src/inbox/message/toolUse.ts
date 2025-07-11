import type {ChatInputPayload} from '@oniichan/shared/model';
import type {ToolUseMessageData, ToolUseResultType} from '@oniichan/shared/inbox';
import {formatStringTemplate} from '@oniichan/shared/string';
import type {InboxRoundtrip, InboxToolUseMessage} from '../interface.js';
import {MessageBase} from './base.js';

export interface ToolUseInit {
    type: ToolUseResultType;
    template: string;
    executionData: Record<string, string | number | null>;
}

export class ToolUseMessage extends MessageBase<'toolUse'> implements InboxToolUseMessage {
    static from(data: ToolUseMessageData, roundtrip: InboxRoundtrip) {
        const message = new ToolUseMessage(
            data.uuid,
            roundtrip,
            {
                type: data.result,
                template: data.template,
                executionData: data.executionData,
            }
        );
        message.restore(data);
        return message;
    }

    private readonly result: ToolUseResultType;

    private readonly template: string;

    private readonly executionData: Record<string, string | number | null>;

    constructor(uuid: string, roundtrip: InboxRoundtrip, init: ToolUseInit) {
        super(uuid, 'toolUse', roundtrip);
        this.result = init.type;
        this.template = init.template;
        this.executionData = init.executionData;
    }

    toMessageData(): ToolUseMessageData {
        return {
            ...this.toMessageDataBase(),
            type: this.type,
            result: this.result,
            template: this.template,
            executionData: this.executionData,
        };
    }

    toChatInputPayload(): ChatInputPayload {
        return {
            role: 'user',
            content: formatStringTemplate(this.template, this.executionData),
        };
    }
}
