import {streamText, generateText, CoreMessage} from 'ai';
import {
    createOpenRouter,
    OpenRouterLanguageModel,
    OpenRouterProvider,
    OpenRouterProviderSettings,
} from '@openrouter/ai-sdk-provider';
import {
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelStreamingResponse,
    ModelTextResponse,
} from './interface';
import {getModelFeature, ModelFeature} from './feature';

type AiChatRequest = Parameters<typeof streamText>[0];

export class OpenRouterModelClient implements ModelClient {
    private readonly provider: OpenRouterProvider;

    private readonly defaultModel: OpenRouterLanguageModel;

    constructor(config: ModelConfiguration) {
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
                model: this.defaultModel.modelId,
                usage: {
                    inputTokens: result.usage.promptTokens,
                    outputTokens: result.usage.completionTokens,
                },
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
        const usage = await result.usage;
        yield {
            type: 'meta',
            model: this.defaultModel.modelId,
            usage: {
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
            },
        };
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
}
