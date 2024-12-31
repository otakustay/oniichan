import OpenAi from 'openai';
import {ModelResponseMetaRecord, PartialToolCallInfo, StreamToolCallRecord} from './utils';
import {
    ChatInputPayload,
    ChatToolPayload,
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelResponse,
    ModelStreamingResponse,
} from './interface';

function transformToolPayload(input: ChatToolPayload): OpenAi.ChatCompletionTool {
    return {
        type: 'function',
        function: {
            name: input.name,
            description: input.description,
            parameters: input.parameters,
        },
    };
}

function transformInputPayload(input: ChatInputPayload): OpenAi.ChatCompletionMessageParam {
    if (input.role === 'tool') {
        const result: OpenAi.ChatCompletionToolMessageParam = {
            role: 'tool',
            tool_call_id: input.callId,
            content: JSON.stringify(input.content),
        };
        return result;
    }
    else if (input.role === 'user') {
        return input;
    }
    else {
        const message: OpenAi.ChatCompletionMessageParam = {
            role: 'assistant',
            content: input.content || null,
        };
        if (input.toolCall) {
            message.tool_calls = [
                {
                    id: input.toolCall.id,
                    type: 'function',
                    function: {
                        name: input.toolCall.functionName,
                        arguments: JSON.stringify(input.toolCall.arguments),
                    },
                },
            ];
        }
        return message;
    }
}

class OpenAiStreamToolCallRecord extends StreamToolCallRecord<OpenAi.ChatCompletionChunk> {
    protected extractFromChunk(chunk: OpenAi.ChatCompletionChunk): PartialToolCallInfo | null {
        const call = chunk.choices[0]?.delta.tool_calls?.at(0);

        if (!call) {
            return null;
        }

        return {
            id: call.id,
            functionName: call.function?.name,
            argumentsDelta: call.function?.arguments ?? '',
        };
    }
}

export class OpenAiModelClient implements ModelClient {
    private readonly client: OpenAi;

    private readonly modelName: string;

    constructor(config: ModelConfiguration) {
        this.client = new OpenAi({apiKey: config.apiKey, baseURL: config.baseUrl});
        this.modelName = config.modelName;
    }

    async chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]> {
        const rqeuest = this.getBaseRequest(options);
        const record = new ModelResponseMetaRecord(this.modelName);
        const response = await this.client.chat.completions.create(rqeuest);
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
        const toolRecord = new OpenAiStreamToolCallRecord();
        for await (const chunk of stream) {
            toolRecord.record(chunk);

            const delta = chunk.choices.at(0)?.delta;

            if (!delta?.tool_calls) {
                const text = delta?.content ?? '';
                if (text) {
                    yield {type: 'text', content: text} as const;
                }
            }

            metaRecord.setInputTokens(chunk.usage?.prompt_tokens);
            metaRecord.addOutputTokens(chunk.usage?.completion_tokens);
        }

        if (toolRecord.isActive()) {
            try {
                yield toolRecord.toToolResponse();
            }
            finally {
                toolRecord.clear();
            }
        }

        yield metaRecord.toResponseMeta();
    }

    private getBaseRequest(options: ModelChatOptions) {
        const request: OpenAi.ChatCompletionCreateParams = {
            messages: options.messages.map(transformInputPayload),
            model: this.modelName,
            max_tokens: 8000,
        };
        if (options.tools?.length) {
            request.tools = options.tools.map(transformToolPayload);
        }
        return request;
    }
}
