import OpenAi from 'openai';
import {ModelResponseMetaRecord} from './utils';
import {ChatMessagePayload, ModelClient, ModelConfiguration, ModelResponseMeta} from './interface';

export class OpenAiModelClient implements ModelClient {
    private readonly client: OpenAi;

    private readonly modelName: string;

    constructor(config: ModelConfiguration) {
        this.client = new OpenAi({apiKey: config.apiKey, baseURL: config.baseUrl});
        this.modelName = config.modelName;
    }

    async chat(messages: ChatMessagePayload[]): Promise<[string, ModelResponseMeta]> {
        const options = this.getBaseRequestOptions(messages);
        const record = new ModelResponseMetaRecord(this.modelName);
        const response = await this.client.chat.completions.create(options);
        record.setInputTokens(response.usage?.prompt_tokens);
        record.addOutputTokens(response.usage?.completion_tokens);
        return [
            response.choices[0]?.message?.content ?? '',
            record.toResponseMeta(),
        ];
    }

    async *chatStreaming(messages: ChatMessagePayload[]) {
        const options = {
            ...this.getBaseRequestOptions(messages),
            stream: true,
        } as const;
        const stream = await this.client.chat.completions.create(options);
        const record = new ModelResponseMetaRecord(this.modelName);
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta.content ?? '';
            if (text) {
                yield text;
            }
            record.setInputTokens(chunk.usage?.prompt_tokens);
            record.addOutputTokens(chunk.usage?.completion_tokens);
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
