import {
    createModelClient,
    isModelConfigValid,
    ModelConfiguration,
    ModelFeature,
    ModelResponse,
    ModelTextResponse,
} from '@oniichan/shared/model';
import {ModelAccess, ModelChatOptions} from './interface';
import {EditorHost} from '../editor';
import {MixtureModelAccess} from './mixture';
import {NamedModelAccess} from './named';

export {ModelChatOptions};

export interface ModelAccessHostInit {
    enableDeepThink: boolean;
}

export class ModelAccessHost implements ModelAccess {
    private readonly editorHost: EditorHost;

    private readonly enableDeepThink: boolean;

    constructor(editorHost: EditorHost, init: ModelAccessHostInit) {
        this.editorHost = editorHost;
        this.enableDeepThink = init.enableDeepThink;
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
        return this.enableDeepThink && config.modelName !== 'deepseek/deepseek-r1'
            ? new MixtureModelAccess(
                createModelClient({...config, modelName: 'deepseek/deepseek-r1'}),
                createModelClient(config)
            )
            : new NamedModelAccess(createModelClient(config));
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
