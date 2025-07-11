import {createModelClient, isModelConfigValid} from '@oniichan/shared/model';
import {LazyContainer} from '@oniichan/shared/container';
import type {ModelFeature, ModelResponse, ModelTextResponse} from '@oniichan/shared/model';
import type {EditorHost} from '../editor.js';
import type {ModelAccess, ModelChatOptions} from './interface.js';
import {NamedModelAccess} from './named.js';

export type {ModelChatOptions};

export class ModelAccessHost extends LazyContainer<ModelAccess> implements ModelAccess {
    constructor(editorHost: EditorHost) {
        const factory = async (triggerUserConfigure = true) => {
            const config = await editorHost.call('getModelConfig');

            if (isModelConfigValid(config)) {
                return new NamedModelAccess(createModelClient(config));
            }

            if (triggerUserConfigure) {
                await editorHost.call('requestModelConfigure');
                return factory(false);
            }

            const missingKeys = Object.entries(config).flatMap(([key, value]) => value ? [] : [key]);
            throw new Error(`Invalid configuration, missing ${missingKeys.join(', ')}`);
        };
        super(factory);
    }

    async getModelName(): Promise<string> {
        const implement = await this.getInstance();
        return implement.getModelName();
    }

    async getModelFeature(): Promise<ModelFeature> {
        const implement = await this.getInstance();
        return implement.getModelFeature();
    }

    async chat(options: ModelChatOptions): Promise<ModelTextResponse> {
        const implement = await this.getInstance();
        return implement.chat(options);
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const implement = await this.getInstance();
        yield* implement.chatStreaming(options);
    }
}
