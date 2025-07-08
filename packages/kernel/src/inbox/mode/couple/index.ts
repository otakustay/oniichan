import type {ModelResponse} from '@oniichan/shared/model';
import type {MessageInputChunk, MessageThreadWorkingMode} from '@oniichan/shared/inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';
import type {ToolName} from '@oniichan/shared/tool';
import {over} from '@otakustay/async-iterator';
import {discard} from '@oniichan/shared/iterable';
import {BaseChatCapabilityProvider} from '../provider';
import type {ChatRole} from '../interface';
import {CoupleActorRole} from './actor';
import {CoupleCoderRole} from './coder';

function toolRequireCoder(toolName: ToolName) {
    return toolName === 'write_file' || toolName === 'patch_file' || toolName === 'evaluate_code';
}

async function* iterable(text: string): AsyncIterable<string> {
    yield text;
}

export class CoupleChatCapabilityProvider extends BaseChatCapabilityProvider {
    private useCoderModel = false;

    protected getWorkingMode(): MessageThreadWorkingMode {
        return 'couple';
    }

    provideChatRole(): ChatRole {
        return this.useCoderModel
            ? new CoupleCoderRole(this.config.actorModel, this.config.coderModel)
            : new CoupleActorRole(this.config.actorModel);
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
