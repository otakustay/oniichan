import {Client} from '@otakustay/ipc';
import {Protocol} from '@oniichan/host/server';
import {newUuid} from '@oniichan/shared/id';
import {ChatMessagePayload, createModelClient, ModelClient} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {ModelConfiguration} from '@oniichan/shared/model';
import {CodeResult, streamingExtractCode} from './extract';

export function isModelConfigurationValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.baseUrl && config.modelName);
}

export class ModelAccessHost {
    private readonly taskId: string | undefined;

    private readonly client: Client<Protocol>;

    constructor(taskId: string | undefined, client: Client<Protocol>) {
        this.taskId = taskId;
        this.client = client;
    }

    async chat(messages: ChatMessagePayload[], telemetry: ModelUsageTelemetry): Promise<string> {
        const client = await this.createModelClient();
        telemetry.setRequest(messages);
        const [response, meta] = await client.chat(messages);
        telemetry.setResponse(response, meta);
        void telemetry.record();
        return response;
    }

    async *chatStreaming(messages: ChatMessagePayload[], telemetry: ModelUsageTelemetry): AsyncIterable<string> {
        const client = await this.createModelClient();
        telemetry.setRequest(messages);
        const chunks = [];
        for await (const chunk of client.chatStreaming(messages)) {
            if (typeof chunk === 'string') {
                chunks.push(chunk);
                yield chunk;
            }
            else {
                telemetry.setResponse(chunks.join(''), chunk);
            }
        }
        void telemetry.record();
    }

    async *codeStreaming(messages: ChatMessagePayload[], telemetry: ModelUsageTelemetry): AsyncIterable<CodeResult> {
        const client = await this.createModelClient();
        const chunks = [];
        telemetry.setRequest(messages);
        for await (const chunk of streamingExtractCode(client.chatStreaming(messages))) {
            switch (chunk.type) {
                case 'code':
                    yield chunk.value;
                    break;
                case 'chunk':
                    chunks.push(chunk.value);
                    break;
                case 'other':
                    telemetry.setResponse(chunks.join(''), chunk.value);
                    break;
            }
        }
        void telemetry.record();
    }

    private async createModelClient(triggerUserConfigure = true): Promise<ModelClient> {
        const config = await this.getModelConfiguration();

        if (isModelConfigurationValid(config)) {
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
