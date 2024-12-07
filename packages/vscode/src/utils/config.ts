import {ConfigurationTarget, workspace} from 'vscode';

export function getModelConfiguration() {
    const config = workspace.getConfiguration('oniichan.model');
    const apiKey = config.get<string>('anthropicApiKey', '');
    const baseUrl = config.get<string>('anthropicBaseUrl', 'https://anthropic.com');

    return {
        apiKey,
        baseUrl,
    };
}

export async function updateApiKey(apiKey: string) {
    const config = workspace.getConfiguration('oniichan.model');
    await config.update('anthropicApiKey', apiKey, ConfigurationTarget.Global);
}

export type SemanticRewriteTriggerType = 'Manual' | 'Automatic';

export function getSemanticRewriteConfiguration() {
    const config = workspace.getConfiguration('oniichan.semanticRewrite');
    return {
        triggerType: config.get<SemanticRewriteTriggerType>('triggerType', 'Manual'),
    };
}
