import {Anthropic} from '@anthropic-ai/sdk';
import {ModelResponseMetaRecord} from './utils';
import {ChatMessagePayload, ModelClient, ModelConfiguration, ModelResponseMeta} from './interface';

export class AnthropicModelClient implements ModelClient {
    private readonly client: Anthropic;

    private readonly modelName: string;

    constructor(config: ModelConfiguration) {
        this.client = new Anthropic({apiKey: config.apiKey, baseURL: config.baseUrl});
        this.modelName = config.modelName;
    }

    async chat(messages: ChatMessagePayload[]): Promise<[string, ModelResponseMeta]> {
        const options = this.getBaseRequestOptions(messages);
        const record = new ModelResponseMetaRecord(this.modelName);
        const response = await this.client.messages.create(options);
        record.setInputTokens(response.usage.input_tokens);
        record.addOutputTokens(response.usage.output_tokens);
        return [
            response.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n'),
            record.toResponseMeta(),
        ];
    }

    async *chatStreaming(messages: ChatMessagePayload[]) {
        const options = {
            ...this.getBaseRequestOptions(messages),
            stream: true,
        } as const;
        const stream = await this.client.messages.create(options);
        const record = new ModelResponseMetaRecord(this.modelName);
        for await (const chunk of stream) {
            if (chunk.type === 'message_start') {
                record.setInputTokens(chunk.message.usage.input_tokens);
                record.addOutputTokens(chunk.message.usage.output_tokens);
            }
            else if (chunk.type === 'message_delta') {
                record.addOutputTokens(chunk.usage.output_tokens);
            }
            else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield chunk.delta.text;
            }
        }
        yield record.toResponseMeta();
    }

    private getBaseRequestOptions(messages: ChatMessagePayload[]) {
        return {
            messages,
            model: this.modelName,
            max_tokens: 8000,
        } as const;
    }
}
