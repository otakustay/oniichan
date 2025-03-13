import {createModelClient, isModelConfigValid} from '@oniichan/shared/model';
import type {ModelConfiguration, ModelFeature, ModelResponse, ModelTextResponse} from '@oniichan/shared/model';
import type {ModelAccess, ModelChatOptions} from './interface';
import type {EditorHost} from '../editor';
import {NamedModelAccess} from './named';

export type {ModelChatOptions};

export class ModelAccessHost implements ModelAccess {
    private readonly editorHost: EditorHost;

    constructor(editorHost: EditorHost) {
        this.editorHost = editorHost;
    }

    async getModelFeature(): Promise<ModelFeature> {
        const implement = await this.createImplement();
        return implement.getModelFeature();
    }

    async chat(options: ModelChatOptions): Promise<ModelTextResponse> {
        const implement = await this.createImplement();
        return implement.chat(options);
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const implement = await this.createImplement();
        yield* implement.chatStreaming(options);
    }

    private createImplementFromConfig(config: ModelConfiguration): ModelAccess {
        return new NamedModelAccess(createModelClient(config));
    }

    private async createImplement(triggerUserConfigure = true): Promise<ModelAccess> {
        const config = await this.getModelConfiguration();

        if (isModelConfigValid(config)) {
            return this.createImplementFromConfig(config);
        }

        if (triggerUserConfigure) {
            await this.editorHost.call('requestModelConfigure');
            return this.createImplement(false);
        }

        const missingKeys = Object.entries(config).flatMap(([key, value]) => value ? [] : [key]);
        throw new Error(`Invalid configuration, missing ${missingKeys.join(', ')}`);
    }

    private async getModelConfiguration(): Promise<ModelConfiguration> {
        const config = await this.editorHost.call('getModelConfig');
        return config;
    }
}
