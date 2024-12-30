import {ModelConfiguration, ModelClient} from './interface';
import {AnthropicModelClient} from './anthropic';
import {OpenAiModelClient} from './openai';

function validateModelConfiguration(config: ModelConfiguration): void {
    if (!config.modelName) {
        throw new Error('Require modelName to create a model client');
    }

    if (!config.apiKey) {
        throw new Error('Require apiKey to create a model client');
    }

    if (!config.baseUrl) {
        throw new Error('Require baseUrl to create a model client');
    }
}

export function createModelClient(config: ModelConfiguration): ModelClient {
    validateModelConfiguration(config);

    const client = config.apiStyle === 'Anthropic'
        ? new AnthropicModelClient(config)
        : new OpenAiModelClient(config);
    return client;
}

export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.baseUrl && config.modelName);
}
