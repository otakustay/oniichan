import type {ModelClient, ModelResponse, ModelFeature, ModelTextResponse} from '@oniichan/shared/model';
import type {ModelChatOptions, ModelAccess} from './interface.js';

export class NamedModelAccess implements ModelAccess {
    private readonly client: ModelClient;

    constructor(client: ModelClient) {
        this.client = client;
    }

    async getModelName(): Promise<string> {
        return this.client.getModelName();
    }

    async getModelFeature(): Promise<ModelFeature> {
        return this.client.getModelFeature();
    }

    async chat(options: ModelChatOptions): Promise<ModelTextResponse> {
        const {messages, telemetry} = options;
        telemetry.setRequest(messages);
        telemetry.setModelName(options.overrideModelName ?? this.client.getModelName());
        try {
            const [response, meta] = await this.client.chat(options);
            telemetry.setResponseChunk(response);
            telemetry.setResponseChunk(meta);
            return response;
        }
        finally {
            void telemetry.record();
        }
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const {messages, telemetry} = options;
        telemetry.setRequest(messages);
        telemetry.setModelName(options.overrideModelName ?? this.client.getModelName());
        try {
            for await (const chunk of this.client.chatStreaming(options)) {
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
