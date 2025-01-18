import {ModelMetaResponse, ModelUsage} from './interface';

export class ModelResponseMetaRecord {
    private readonly model: string;

    private readonly usage: ModelUsage = {inputTokens: null, outputTokens: null};

    constructor(model: string) {
        this.model = model;
    }

    setInputTokens(inputTokens: number | null | undefined) {
        if (typeof inputTokens === 'number') {
            this.usage.inputTokens = inputTokens;
        }
    }

    addOutputTokens(outputTokens: number | null | undefined) {
        if (typeof outputTokens !== 'number') {
            return;
        }

        if (this.usage.outputTokens === null) {
            this.usage.outputTokens = 0;
        }

        this.usage.outputTokens += outputTokens;
    }

    toResponseMeta(): ModelMetaResponse {
        return {
            type: 'meta',
            model: this.model,
            usage: this.usage,
        };
    }
}
