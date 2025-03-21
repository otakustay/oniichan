import {createModelClient, type ChatInputPayload, type ModelResponse} from '@oniichan/shared/model';
import type {AssistantRole, MessageInputChunk} from '@oniichan/shared/inbox';
import {StreamingToolParser, type ToolName} from '@oniichan/shared/tool';
import {over} from '@otakustay/async-iterator';
import {discard} from '@oniichan/shared/iterable';
import {isAbortError} from '@oniichan/shared/error';
import {ChatCapabilityProvider} from './base';
import {SystemPromptGenerator} from './prompt';
import type {SystemPromptGeneratorInit} from './prompt';

function toolRequireCoder(toolName: ToolName) {
    return toolName === 'write_file' || toolName === 'patch_file';
}

async function* iterable(text: string): AsyncIterable<string> {
    yield text;
}

export class CoupleChatCapabilityProvider extends ChatCapabilityProvider {
    private useCoderModel = false;

    async provideAssistantRole(): Promise<AssistantRole> {
        return 'standalone';
    }

    async *provideChatStream(): AsyncIterable<MessageInputChunk> {
        const controller = new AbortController();
        try {
            for await (const chunk of super.chat({abortSignal: controller.signal})) {
                yield chunk;

                if (!this.useCoderModel && chunk.type === 'toolStart' && toolRequireCoder(chunk.toolName)) {
                    // This makes the next `provideChatStream` call switching to coder model
                    this.useCoderModel = true;
                    controller.abort('Switch to coder model');
                    yield* this.provideChatStream();
                    return;
                }
            }
        }
        catch (ex) {
            if (!isAbortError(ex)) {
                throw ex;
            }
        }
    }

    protected async provideModelName(): Promise<string | undefined> {
        return this.useCoderModel ? this.config.coderModel || this.config.actorModel : this.config.actorModel;
    }

    protected async provideChatMessages(): Promise<ChatInputPayload[]> {
        const messages = this.getInboxMessages();
        if (this.useCoderModel) {
            const reply = this.roundtrip.getLatestTextMessageStrict();
            messages.push(reply);
        }
        return messages.map(v => v.toChatInputPayload());
    }

    protected async provideSystemPrompt(): Promise<string> {
        const modelName = await this.provideModelName() ?? this.config.actorModel;
        // A fake client to get the model feature
        const client = createModelClient({modelName, apiKey: 'fake'});
        const generatorInit: SystemPromptGeneratorInit = {
            role: 'standalone',
            workingMode: 'normal',
            modelFeature: client.getModelFeature(),
            logger: this.logger,
            references: this.references,
            editorHost: this.editorHost,
        };
        const generator = new SystemPromptGenerator(generatorInit);
        return generator.renderSystemPrompt();
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
