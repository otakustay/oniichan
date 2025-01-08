import {Anthropic} from '@anthropic-ai/sdk';
import {ModelResponseMetaRecord, StreamToolCallRecord, ToolRecordChunk} from './utils';
import {
    ModelClient,
    ModelConfiguration,
    ModelResponse,
    ModelMetaResponse,
    ModelChatOptions,
    ChatInputPayload,
    ChatToolPayload,
} from './interface';

function transformToolPayload(input: ChatToolPayload): Anthropic.Tool {
    return {
        name: input.name,
        description: input.description,
        input_schema: input.parameters,
    };
}

function transformInputPayload(input: ChatInputPayload): Anthropic.MessageParam {
    if (input.role === 'tool') {
        return {
            role: 'user',
            content: [
                {
                    type: 'tool_result',
                    tool_use_id: input.callId,
                    content: JSON.stringify(input.content),
                },
            ],
        };
    }
    else if (input.role === 'user') {
        return input;
    }
    else if (input.toolCall) {
        const content: Anthropic.ContentBlockParam[] = [
            {
                type: 'tool_use',
                id: input.toolCall.id,
                name: input.toolCall.functionName,
                input: input.toolCall.arguments,
            },
        ];
        if (input.content) {
            content.unshift({type: 'text', text: input.content});
        }
        return {
            role: 'assistant',
            content,
        };
    }

    return {
        role: 'assistant',
        content: input.content,
    };
}

class AnthropicStreamToolCallRecord extends StreamToolCallRecord<Anthropic.RawMessageStreamEvent> {
    protected extractFromChunk(chunk: Anthropic.RawMessageStreamEvent): ToolRecordChunk {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            return {type: 'text', content: chunk.delta.text};
        }
        if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
            const use = chunk.content_block;
            return {
                type: 'tool',
                id: use.id,
                functionName: use.name,
            };
        }
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta' && this.isActive()) {
            return {
                type: 'tool',
                argumentsDelta: chunk.delta.partial_json,
            };
        }
        return {
            type: 'text',
            content: '',
        };
    }
}

export class AnthropicModelClient implements ModelClient {
    private readonly client: Anthropic;

    private readonly modelName: string;

    constructor(config: ModelConfiguration) {
        this.client = new Anthropic({apiKey: config.apiKey, baseURL: config.baseUrl});
        this.modelName = config.modelName;
    }

    async chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]> {
        const request = this.getBaseRequest(options);
        const record = new ModelResponseMetaRecord(this.modelName);
        const response = await this.client.messages.create(request);
        record.setInputTokens(response.usage.input_tokens);
        record.addOutputTokens(response.usage.output_tokens);
        return [
            {type: 'text', content: response.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n')},
            record.toResponseMeta(),
        ];
    }

    async *chatStreaming(options: ModelChatOptions) {
        const request = {
            ...this.getBaseRequest(options),
            stream: true,
        } as const;
        const stream = await this.client.messages.create(request);
        const metaRecord = new ModelResponseMetaRecord(this.modelName);
        const toolRecord = new AnthropicStreamToolCallRecord();
        for await (const chunk of stream) {
            toolRecord.record(chunk);

            if (chunk.type === 'message_start') {
                metaRecord.setInputTokens(chunk.message.usage.input_tokens);
                metaRecord.addOutputTokens(chunk.message.usage.output_tokens);
            }
            else if (chunk.type === 'message_delta') {
                metaRecord.addOutputTokens(chunk.usage.output_tokens);
            }
            else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield {type: 'text', content: chunk.delta.text} as const;
            }
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
        const request: Anthropic.MessageCreateParams = {
            messages: options.messages.map(transformInputPayload),
            model: this.modelName,
            max_tokens: 8000,
            system: options.systemPrompt,
        };
        if (options.tools?.length) {
            request.tools = options.tools.map(transformToolPayload);
        }
        return request;
    }
}
