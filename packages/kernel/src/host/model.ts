import {Client} from '@otakustay/ipc';
import {Protocol} from '@oniichan/host/server';
import {newUuid} from '@oniichan/shared/id';
import {ChatMessagePayload, createModelClient, ModelClient} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {ModelConfiguration} from '@oniichan/shared/model';

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
