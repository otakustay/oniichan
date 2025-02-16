import {ModelConfiguration, ModelClient} from './interface';
import {OpenRouterModelClient} from './openRouter';

export {
    ChatUserMessagePayload,
    ChatAssistantMessagePayload,
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelUsage,
    ModelResponse,
    ModelStreamingResponse,
    ChatInputPayload,
} from './interface';
export {ModelFeature} from './feature';

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

export function modelRequiresToolThinking(modelName: string) {
    return modelName.includes('claude');
}
