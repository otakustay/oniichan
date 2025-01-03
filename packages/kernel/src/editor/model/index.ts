import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';
import {
    createModelClient,
    ModelClient,
    isModelConfigValid,
    ModelResponse,
    ChatToolPayload,
    ChatInputPayload,
} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {CodeResult, streamingExtractCode} from './extract';

export interface ModelChatOptionsNoTools {
    messages: ChatInputPayload[];
    telemetry: ModelUsageTelemetry;
    systemPrompt?: string;
}

export interface ModelChatOptions extends ModelChatOptionsNoTools {
    tools?: ChatToolPayload[];
}

export class ModelAccessHost {
    private readonly taskId: string | undefined;

    private readonly client: EditorHostClient;

    constructor(taskId: string | undefined, client: EditorHostClient) {
        this.taskId = taskId;
        this.client = client;
    }

    async chat(options: ModelChatOptions): Promise<ModelResponse> {
        const {messages, systemPrompt, telemetry} = options;
        const client = await this.createModelClient();
        telemetry.setRequest(messages);
        const [response, meta] = await client.chat({messages, systemPrompt});
        telemetry.setResponseChunk(response);
        telemetry.setResponseChunk(meta);
        void telemetry.record();
        return response;
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const {messages, tools, systemPrompt, telemetry} = options;
        const client = await this.createModelClient();
        telemetry.setRequest(messages);
        for await (const chunk of client.chatStreaming({messages, tools, systemPrompt})) {
            telemetry.setResponseChunk(chunk);
            if (chunk.type !== 'meta') {
                yield chunk;
            }
        }
        void telemetry.record();
    }

    async *codeStreaming(options: ModelChatOptionsNoTools): AsyncIterable<CodeResult> {
        const {messages, telemetry} = options;
        const client = await this.createModelClient();
        telemetry.setRequest(messages);
        for await (const chunk of streamingExtractCode(client.chatStreaming({messages}))) {
            switch (chunk.type) {
                case 'code':
                    yield chunk.value;
                    break;
                case 'chunk':
                    telemetry.setResponseChunk(chunk.value);
                    break;
            }
        }
        void telemetry.record();
    }

    private async createModelClient(triggerUserConfigure = true): Promise<ModelClient> {
        const config = await this.getModelConfiguration();

        if (isModelConfigValid(config)) {
            const client = createModelClient(config);
            return client;
        }

        if (triggerUserConfigure) {
            await this.client.call(newUuid(this.taskId), 'requestModelConfigure');
            return this.createModelClient(false);
        }

        const missingKeys = Object.entries(config).flatMap(([key, value]) => value ? [] : [key]);
        throw new Error(`Invalid configuration, missing ${missingKeys.join(', ')}`);
    }

    private async getModelConfiguration() {
        const config = await this.client.call(newUuid(this.taskId), 'getModelConfig');
        return config;
    }
}
