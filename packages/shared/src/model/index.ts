import {ModelConfiguration, ModelClient} from './interface';
import {OpenAiModelClient} from './openai';

export {
    ChatUserMessagePayload,
    ChatAssistantMessagePayload,
    ChatToolParameterSchema,
    ChatToolPayload,
    ModelChatOptions,
    ModelClient,
    ModelConfiguration,
    ModelMetaResponse,
    ModelUsage,
    ModelResponse,
    ModelTextResponse,
    ModelToolResponse,
    ModelStreamingResponse,
    ChatInputPayload,
    ChatToolCallPayload,
} from './interface';

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

    const client = new OpenAiModelClient(config);
    return client;
}

export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.modelName);
}
