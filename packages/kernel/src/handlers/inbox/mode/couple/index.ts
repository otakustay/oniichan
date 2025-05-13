import type {ChatInputPayload, ModelResponse} from '@oniichan/shared/model';
import type {AssistantRole, MessageInputChunk, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import {over} from '@otakustay/async-iterator';
import {discard} from '@oniichan/shared/iterable';
import {ChatCapabilityProvider} from '../base/provider';
import type {ChatRole} from '../base/provider';
import type {InboxAssistantTextMessage, InboxMessage} from '../../../../inbox';

class CoupleActorRole implements ChatRole {
    private readonly actorModelName: string;

    constructor(actorModelName: string) {
        this.actorModelName = actorModelName;
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        // Couple mode always behaves as standalone
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}

class CoupleCoderRole implements ChatRole {
    private readonly actorModelName: string;

    private readonly coderModelName: string | null;

    private readonly partialReply: InboxAssistantTextMessage;

    constructor(actorModelName: string, coderModelName: string | null, reply: InboxAssistantTextMessage) {
        this.actorModelName = actorModelName;
        this.coderModelName = coderModelName;
        this.partialReply = reply;
    }

    provideModelOverride(): string | undefined {
        return this.coderModelName || this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        throw new Error('Method not implemented.');
    }

    provideObjective(): string {
        throw new Error('Method not implemented.');
    }

    provideRoleName(): AssistantRole {
        // Couple mode always behaves as standalone
        return 'standalone';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return [...messages, this.partialReply].map(v => v.toChatInputPayload());
    }
}

function toolRequireCoder(toolName: ToolName) {
    return toolName === 'write_file' || toolName === 'patch_file';
}

async function* iterable(text: string): AsyncIterable<string> {
    yield text;
}

export class CoupleChatCapabilityProvider extends ChatCapabilityProvider {
    private useCoderModel = false;

    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'couple';
    }

    protected getChatRole(): ChatRole {
        if (this.useCoderModel) {
            const reply = this.roundtrip.getLatestTextMessageStrict();
            return new CoupleCoderRole(this.config.actorModel, this.config.coderModel, reply);
        }
        else {
            return new CoupleActorRole(this.config.actorModel);
        }
    }

    async *provideChatStream(): AsyncIterable<MessageInputChunk> {
        const controller = new AbortController();
        for await (const chunk of super.chat({abortSignal: controller.signal})) {
            yield chunk;

            if (!this.useCoderModel && chunk.type === 'toolStart' && toolRequireCoder(chunk.toolName)) {
                // This makes the next `provideChatStream` call switching to coder model
                this.logger.trace('CoupleSwitchToCoderModel');
                this.useCoderModel = true;
                controller.abort();
                yield* this.provideChatStream();
                return;
            }
        }
    }

    protected async *consumeChatStream(chatStream: AsyncIterable<ModelResponse>): AsyncIterable<MessageInputChunk> {
        if (!this.useCoderModel) {
            yield* super.consumeChatStream(chatStream);
        }

        const parser = new StreamingToolParser();
        const reply = this.roundtrip.getLatestTextMessageStrict();
        await discard(parser.parse(iterable(reply.getTextContent())));
        const textSteam = over(chatStream).filter(v => v.type === 'text').map(v => v.content);
        yield* parser.parse(textSteam);
    }
}
