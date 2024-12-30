import {Anthropic} from '@anthropic-ai/sdk';
import OpenAi from 'openai';

export interface ChatMessagePayload {
    role: 'user' | 'assistant';
    content: string;
}

export type ModelApiStyle = 'OpenAI' | 'Anthropic';

export interface ModelConfiguration {
    apiStyle: ModelApiStyle;
    modelName: string;
    baseUrl: string;
    apiKey: string;
}

function validateModelConfiguration(config: ModelConfiguration): void {
    if (!config.modelName) {
        throw new Error('Require modelName to create a model client');
    }

    if (!config.apiKey) {
        throw new Error('Require apiKey to create a model client');
    }

    if (!config.baseUrl) {
        throw new Error('Require baseUrl to create a model client');
    }
}

export interface ModelUsage {
    inputTokens: number | null;
    outputTokens: number | null;
}

export interface ModelResponseMeta {
    model: string;
    usage: ModelUsage;
}

export interface ModelClient {
    chat(messages: ChatMessagePayload[]): Promise<[string, ModelResponseMeta]>;
    chatStreaming(messages: ChatMessagePayload[]): AsyncIterable<string | ModelResponseMeta>;
}

function addUsage(x: number | null, y: number | null | undefined) {
    if (typeof y !== 'number') {
        return x;
    }

    return (x ?? 0) + y;
}

export function createModelClient(config: ModelConfiguration): ModelClient {
    validateModelConfiguration(config);

    const {apiStyle, modelName, baseUrl, apiKey} = config;

    if (apiStyle === 'Anthropic') {
        const client = new Anthropic({apiKey, baseURL: baseUrl});
        return {
            async chat(messages) {
                const params: Anthropic.MessageCreateParams = {
                    messages,
                    model: modelName,
                    max_tokens: 8000,
                };
                const result = await client.messages.create(params);
                return [
                    result.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n'),
                    {
                        model: modelName,
                        usage: {
                            inputTokens: result.usage.input_tokens,
                            outputTokens: result.usage.output_tokens,
                        },
                    },
                ];
            },
            async *chatStreaming(messages) {
                const options = {
                    messages,
                    model: modelName,
                    max_tokens: 8000,
                    stream: true,
                } as const;
                const stream = await client.messages.create(options);
                const meta: ModelResponseMeta = {
                    model: modelName,
                    usage: {
                        inputTokens: 0,
                        outputTokens: 0,
                    },
                };
                for await (const chunk of stream) {
                    if (chunk.type === 'message_start') {
                        meta.usage.inputTokens = chunk.message.usage.input_tokens;
                        meta.usage.outputTokens = chunk.message.usage.output_tokens;
                    }
                    else if (chunk.type === 'message_delta') {
                        addUsage(meta.usage.outputTokens, chunk.usage.output_tokens);
                    }
                    else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        yield chunk.delta.text;
                    }
                }
            },
        };
    }
    else {
        const client = new OpenAi({apiKey, baseURL: baseUrl});
        return {
            async chat(messages) {
                const options = {
                    messages,
                    model: modelName,
                    max_tokens: 8000,
                } as const;
                const response = await client.chat.completions.create(options);
                return [
                    response.choices[0]?.message?.content ?? '',
                    {
                        model: modelName,
                        usage: {
                            inputTokens: response.usage?.prompt_tokens ?? null,
                            outputTokens: response.usage?.completion_tokens ?? null,
                        },
                    },
                ];
            },
            async *chatStreaming(messages) {
                const options = {
                    messages,
                    model: modelName,
                    max_tokens: 8000,
                    stream: true,
                } as const;
                const stream = await client.chat.completions.create(options);
                const meta: ModelResponseMeta = {
                    model: modelName,
                    usage: {
                        inputTokens: 0,
                        outputTokens: 0,
                    },
                };
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta.content ?? '';
                    if (text) {
                        yield text;
                    }
                    if (meta.usage.inputTokens === null && typeof chunk.usage?.prompt_tokens === 'number') {
                        meta.usage.inputTokens = chunk.usage.prompt_tokens;
                    }
                    meta.usage.outputTokens = addUsage(meta.usage.outputTokens, chunk.usage?.completion_tokens);
                }
                yield meta;
            },
        };
    }
}

export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.baseUrl && config.modelName);
}
