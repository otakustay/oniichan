import {workspace} from 'vscode';
import type {ModelConfiguration} from '@oniichan/shared/model';

export type SemanticRewriteTriggerType = 'Manual' | 'Automatic';

export function getSemanticRewriteConfiguration() {
    const config = workspace.getConfiguration('oniichan.semanticRewrite');
    return {
        triggerType: config.get<SemanticRewriteTriggerType>('triggerType', 'Manual'),
    };
}

export function getModelConfig(): ModelConfiguration {
    const config = workspace.getConfiguration('oniichan.model');

    const apiKey = config.get<string>('apiKey', '');
    const modelName = config.get<string>(
        'modelName',
        'anthropic/claude-3.5-sonnet'
    );

    return {apiKey, modelName};
}
