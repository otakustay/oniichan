import type {ModelConfiguration, ModelClient} from './interface.js';
import {OpenRouterModelClient} from './openRouter.js';

export type {
    ChatUserMessagePayload,
    ChatAssistantMessagePayload,
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelRequestDetail,
    ModelTextResponse,
    ModelResponse,
    ModelStreamingResponse,
    ChatInputPayload,
} from './interface.js';
export {getModelFeature} from './feature.js';
export type {ModelFeature} from './feature.js';

function validateModelConfiguration(config: ModelConfiguration): void {
    if (!config.modelName) {
        throw new Error('Require modelName to create a model client');
    }

    if (!config.apiKey) {
        throw new Error('Require apiKey to create a model client');
    }
}

export function createModelClient(config: ModelConfiguration): ModelClient {
    validateModelConfiguration(config);

    const client = new OpenRouterModelClient(config);
    return client;
}

export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.modelName);
}
