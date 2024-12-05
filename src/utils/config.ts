import {workspace} from 'vscode';

export function getModelConfiguration() {
    const config = workspace.getConfiguration('oniichan.model');
    const apiKey = config.get<string>('anthropicApiKey');
    const baseUrl = config.get<string>('anthropicBaseUrl', 'https://anthropic.com');

    if (!apiKey) {
        throw new Error('You must set the API key for Anthropic in your settings.');
    }

    return {
        apiKey,
        baseUrl,
    };
}

export type SemanticRewriteTriggerType = 'Manual' | 'Automatic';

export function getSemanticRewriteConfiguration() {
    const config = workspace.getConfiguration('oniichan.semanticRewrite');
    return {
        triggerType: config.get<SemanticRewriteTriggerType>('triggerType', 'Manual'),
    };
}
