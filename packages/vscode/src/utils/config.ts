import {workspace} from 'vscode';

export type SemanticRewriteTriggerType = 'Manual' | 'Automatic';

export function getSemanticRewriteConfiguration() {
    const config = workspace.getConfiguration('oniichan.semanticRewrite');
    return {
        triggerType: config.get<SemanticRewriteTriggerType>('triggerType', 'Manual'),
    };
}
