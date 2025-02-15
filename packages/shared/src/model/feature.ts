export interface ModelFeature {
    supportReasoning: boolean;
    requireToolThinking: boolean;
    shouldAvoidSystemPrompt: boolean;
    temperature?: number;
}

const MODEL_FEATURES: Record<string, ModelFeature> = {
    'deepseek-r1': {
        supportReasoning: true,
        requireToolThinking: false,
        shouldAvoidSystemPrompt: true,
        temperature: 0.6,
    },
    claude: {
        supportReasoning: false,
        requireToolThinking: true,
        shouldAvoidSystemPrompt: false,
    },
};

export function getModelFeature(model: string): ModelFeature {
    for (const [keyword, feature] of Object.entries(MODEL_FEATURES)) {
        if (model.includes(keyword)) {
            return feature;
        }
    }

    return {
        supportReasoning: false,
        requireToolThinking: false,
        shouldAvoidSystemPrompt: false,
    };
}
