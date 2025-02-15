import OpenAi from 'openai';
import {ModelResponseMetaRecord} from './utils';
import {
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelResponse,
    ModelStreamingResponse,
} from './interface';
import {getModelFeature, ModelFeature} from './feature';

const OPEN_ROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

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
        const feature = this.getModelFeature();
        const messages: OpenAi.ChatCompletionMessageParam[] = [...options.messages];

        if (!messages.length) {
            throw new Error('No messages provided for chat');
        }

        if (options.systemPrompt) {
            if (feature.shouldAvoidSystemPrompt) {
                const content = this.combineSystemAndUserPrompt(options.systemPrompt, options.messages[0].content);
                messages[0] = {role: 'user', content};
            }
            else {
                messages.unshift({role: 'system', content: options.systemPrompt});
            }
        }
        const request: OpenAi.ChatCompletionCreateParams = {
            messages,
            model: this.modelName,
            max_tokens: 8000,
            temperature: feature.temperature,
        };
        return request;
    }

    getModelFeature(): ModelFeature {
        return getModelFeature(this.modelName);
    }

    private combineSystemAndUserPrompt(system: string, user: string): string {
        const lines = [
            system,
            '',
            '# User Request',
            '',
            'This is the user\'s request, respond with the same language as content below.',
            '',
            user,
        ];
        return lines.join('\n');
    }
}
