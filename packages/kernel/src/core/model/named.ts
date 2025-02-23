import {ModelClient, ModelResponse, ModelFeature} from '@oniichan/shared/model';
import {ModelChatOptions, ModelAccess} from './interface';

export class NamedModelAccess implements ModelAccess {
    private readonly client: ModelClient;

    constructor(client: ModelClient) {
        this.client = client;
    }

    async getModelFeature(): Promise<ModelFeature> {
        return this.client.getModelFeature();
    }

    async chat(options: ModelChatOptions): Promise<ModelResponse> {
        const {messages, systemPrompt, telemetry, abortSignal} = options;
        telemetry.setRequest(messages);
        try {
            const [response, meta] = await this.client.chat({messages, systemPrompt, abortSignal});
            telemetry.setResponseChunk(response);
            telemetry.setResponseChunk(meta);
            return response;
        }
        finally {
            void telemetry.record();
        }
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const {messages, systemPrompt, telemetry, abortSignal} = options;
        telemetry.setRequest(messages);
        try {
            for await (const chunk of this.client.chatStreaming({messages, systemPrompt, abortSignal})) {
                telemetry.setResponseChunk(chunk);

                if (chunk.type !== 'meta') {
                    yield chunk;
                }
            }
        }
        finally {
            void telemetry.record();
        }
    }
}
