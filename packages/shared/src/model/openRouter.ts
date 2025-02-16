import {streamText, generateText, CoreMessage} from 'ai';
import {createOpenRouter, OpenRouterLanguageModel, OpenRouterProviderSettings} from '@openrouter/ai-sdk-provider';
import {
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelResponse,
    ModelStreamingResponse,
} from './interface';
import {getModelFeature, ModelFeature} from './feature';

type AiChatRequest = Parameters<typeof streamText>[0];

export class OpenRouterModelClient implements ModelClient {
    private readonly provider: OpenRouterLanguageModel;

    constructor(config: ModelConfiguration) {
        const providerSettings: OpenRouterProviderSettings = {
            apiKey: config.apiKey,
            compatibility: 'strict',
            headers: {
                'HTTP-Referer': 'https://github.com/otakustay/oniichan',
                'X-Title': 'Oniichan',
            },
        };
        const openRouter = createOpenRouter(providerSettings);
        const modelFeature = getModelFeature(config.modelName);
        this.provider = openRouter.chat(config.modelName, {includeReasoning: modelFeature.supportReasoning});
    }

    async chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]> {
        const request = this.getRequest(options);
        const result = await generateText(request);
        return [
            {type: 'text', content: result.text},
            {
                type: 'meta',
                model: this.provider.modelId,
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
            model: this.provider.modelId,
            usage: {
                inputTokens: usage.promptTokens,
                outputTokens: usage.completionTokens,
            },
        };
    }

    getModelFeature(): ModelFeature {
        return getModelFeature(this.provider.modelId);
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
            model: this.provider,
            temperature: feature.temperature,
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
}
