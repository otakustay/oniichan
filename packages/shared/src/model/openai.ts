import OpenAi from 'openai';
import {ModelResponseMetaRecord} from './utils';
import {
    ChatInputPayload,
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelResponse,
    ModelStreamingResponse,
} from './interface';

const OPEN_ROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

function transformInputPayload(input: ChatInputPayload): OpenAi.ChatCompletionMessageParam {
    // TODO: Maybe we can delete this function
    return input;
}

export class OpenAiModelClient implements ModelClient {
    private readonly client: OpenAi;

    private readonly modelName: string;

    constructor(config: ModelConfiguration) {
        const options = {
            apiKey: config.apiKey,
            baseURL: OPEN_ROUTER_BASE_URL,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/otakustay/oniichan',
                'X-Title': 'Oniichan',
            },
        };
        this.client = new OpenAi(options);
        this.modelName = config.modelName;
    }

    async chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]> {
        const request = this.getBaseRequest(options);
        const record = new ModelResponseMetaRecord(this.modelName);
        const response = await this.client.chat.completions.create(request);
        record.setInputTokens(response.usage?.prompt_tokens);
        record.addOutputTokens(response.usage?.completion_tokens);
        return [
            {type: 'text', content: response.choices[0]?.message?.content ?? ''},
            record.toResponseMeta(),
        ];
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelStreamingResponse> {
        const request = {
            ...this.getBaseRequest(options),
            stream: true,
        } as const;
        const stream = await this.client.chat.completions.create(request);
        const metaRecord = new ModelResponseMetaRecord(this.modelName);
        for await (const chunk of stream) {
            const delta = chunk.choices.at(0)?.delta;
            const text = delta?.content ?? '';
            if (text) {
                yield {type: 'text', content: text} as const;
            }
            metaRecord.setInputTokens(chunk.usage?.prompt_tokens);
            metaRecord.addOutputTokens(chunk.usage?.completion_tokens);
        }

        yield metaRecord.toResponseMeta();
    }

    private getBaseRequest(options: ModelChatOptions) {
        const messages = options.messages.map(transformInputPayload);
        if (options.systemPrompt) {
            messages.unshift({role: 'system', content: options.systemPrompt});
        }
        const request: OpenAi.ChatCompletionCreateParams = {
            messages,
            model: this.modelName,
            max_tokens: 8000,
        };
        return request;
    }
}
