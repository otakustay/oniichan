import {streamText, generateText} from 'ai';
import type {CoreMessage} from 'ai';
import {createOpenRouter} from '@openrouter/ai-sdk-provider';
import type {
    OpenRouterLanguageModel,
    OpenRouterProvider,
    OpenRouterProviderSettings,
} from '@openrouter/ai-sdk-provider';
import type {
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelStreamingResponse,
    ModelTextResponse,
    ModelRequestDetail,
} from './interface';
import {getModelFeature} from './feature';
import type {ModelFeature} from './feature';

interface OpenRouterGeneration {
    id: string;
    total_cost: number;
    created_at: string;
    model: string;
    origin: string;
    usage: number;
    is_byok: true;
    upstream_id: string;
    cache_discount: number;
    app_id: number;
    streamed: true;
    cancelled: true;
    provider_name: string;
    latency: number;
    moderation_latency: number;
    generation_time: number;
    finish_reason: string;
    native_finish_reason: string;
    tokens_prompt: number;
    tokens_completion: number;
    native_tokens_prompt: number;
    native_tokens_completion: number;
    native_tokens_reasoning: number;
    num_media_prompt: number;
    num_media_completion: number;
    num_search_results: number;
}

interface OpenRouterGenerationResponse {
    data: OpenRouterGeneration;
}

type AiChatRequest = Parameters<typeof streamText>[0];

export class OpenRouterModelClient implements ModelClient {
    private readonly apiKey: string;

    private readonly provider: OpenRouterProvider;

    private readonly defaultModel: OpenRouterLanguageModel;

    constructor(config: ModelConfiguration) {
        this.apiKey = config.apiKey;
        const providerSettings: OpenRouterProviderSettings = {
            apiKey: config.apiKey,
            compatibility: 'strict',
            headers: {
                'HTTP-Referer': 'https://github.com/otakustay/oniichan',
                'X-Title': 'Oniichan',
            },
        };
        this.provider = createOpenRouter(providerSettings);
        const modelFeature = getModelFeature(config.modelName);
        this.defaultModel = this.provider.chat(config.modelName, {includeReasoning: modelFeature.supportReasoning});
    }

    async chat(options: ModelChatOptions): Promise<[ModelTextResponse, ModelMetaResponse]> {
        const request = this.getRequest(options);
        const result = await generateText(request);
        return [
            {type: 'text', content: result.text},
            {
                type: 'meta',
                providerRequestId: result.response.id,
                requestDetail: () => this.fetchGeneration(result.response.id),
            },
        ];
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelStreamingResponse> {
        const request = this.getRequest(options);
        const result = streamText(request);
        for await (const chunk of result.fullStream) {
            switch (chunk.type) {
                case 'text-delta':
                    yield {type: 'text', content: chunk.textDelta};
                    break;
                case 'reasoning':
                    yield {type: 'reasoning', content: chunk.textDelta};
                    break;
            }
        }
        const response = await result.response;
        yield {
            type: 'meta',
            providerRequestId: response.id,
            requestDetail: () => this.fetchGeneration(response.id),
        };
    }

    getModelName(): string {
        return this.defaultModel.modelId;
    }

    getModelFeature(): ModelFeature {
        return getModelFeature(this.defaultModel.modelId);
    }

    private getRequest(options: ModelChatOptions): AiChatRequest {
        const feature = this.getModelFeature();
        const messages: CoreMessage[] = [...options.messages];

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

        return {
            messages,
            model: this.getOrCreateModel(options.overrideModelName),
            temperature: feature.temperature,
            abortSignal: options.abortSignal,
        };
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

    private getOrCreateModel(modelName: string | undefined) {
        if (!modelName || modelName === this.defaultModel.modelId) {
            return this.defaultModel;
        }

        const modelFeature = getModelFeature(modelName);
        return this.provider.chat(modelName, {includeReasoning: modelFeature.supportReasoning});
    }

    private async fetchGeneration(id: string): Promise<ModelRequestDetail> {
        const response = await fetch(
            `https://openrouter.ai/api/v1/generation?id=${id}`,
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch generation with status ${response.status}`);
        }

        const {data} = await response.json() as OpenRouterGenerationResponse;
        return {
            model: data.model,
            finishReason: data.finish_reason,
            inputTokens: data.native_tokens_prompt ?? null,
            reasoningTokens: data.native_tokens_reasoning ?? null,
            outputTokens: data.native_tokens_completion ?? null,
        };
    }
}
