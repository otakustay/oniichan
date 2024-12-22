import {workspace} from 'vscode';
import {ModelApiStyle, ModelConfiguration} from '@oniichan/shared/model';

export type SemanticRewriteTriggerType = 'Manual' | 'Automatic';

export function getSemanticRewriteConfiguration() {
    const config = workspace.getConfiguration('oniichan.semanticRewrite');
    return {
        triggerType: config.get<SemanticRewriteTriggerType>('triggerType', 'Manual'),
    };
}

export function getModelConfig(): ModelConfiguration {
    const config = workspace.getConfiguration('oniichan.model');

    const apiStyle = config.get<ModelApiStyle>('apiStyle', 'Anthropic');
    const apiKey = config.get<string>('apiKey', '');
    const modelName = config.get<string>(
        'modelName',
        apiStyle === 'Anthropic' ? 'claude-3-5-sonnet-latest' : 'gpt-4o'
    );
    const baseUrl = config.get<string>(
        'baseUrl',
        apiStyle === 'Anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'
    );

    return {apiStyle, apiKey, modelName, baseUrl};
}

export function isModelConfigValid(config: ModelConfiguration) {
    return !!(config.apiKey && config.baseUrl && config.modelName);
}
