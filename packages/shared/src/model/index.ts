// Core model interfaces and types for AI model integration
import {ModelConfiguration, ModelClient} from './interface';
import {OpenRouterModelClient} from './openRouter';

// Exports key model interfaces and types for external usage
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

// Validates required fields in model configuration
function validateModelConfiguration(config: ModelConfiguration): void {
    if (!config.modelName) {
        throw new Error('Require modelName to create a model client');
    }

    if (!config.apiKey) {
        throw new Error('Require apiKey to create a model client');
    }
}

// Creates and returns an instance of ModelClient based on configuration
export function createModelClient(config: ModelConfiguration): ModelClient {
    validateModelConfiguration(config);

    const client = new OpenRouterModelClient(config);
    return client;
}

// Checks if a model configuration has required fields populated
export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.modelName);
}
