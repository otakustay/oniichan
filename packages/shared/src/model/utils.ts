import {ModelMetaResponse, ModelToolResponse, ModelUsage} from './interface';

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

export interface PartialToolCallInfo {
    id?: string | undefined;
    functionName?: string | undefined;
    argumentsDelta?: string | undefined;
}

export abstract class StreamToolCallRecord<T> {
    private active = false;

    private callId = '';

    private functionName = '';

    private argumentsText = '';

    record(chunk: T) {
        const info = this.extractFromChunk(chunk);

        if (!info) {
            return;
        }

        // Some LLM generates multiple tool use chunks in one stream, we only preserve the first one
        if (this.active && info.id && info.id !== this.callId) {
            return;
        }

        this.active = true;
        if (info.id) {
            this.callId = info.id;
        }
        if (info.functionName) {
            this.functionName = info.functionName;
        }
        if (info.argumentsDelta) {
            this.argumentsText += info.argumentsDelta;
        }
    }

    isActive() {
        return this.active;
    }

    toToolResponse(): ModelToolResponse {
        try {
            const args = JSON.parse(this.argumentsText);
            return {
                type: 'tool',
                id: this.callId,
                name: this.functionName,
                arguments: args,
            };
        }
        catch {
            throw new Error(`Model yields invalid tool call arguments: ${this.argumentsText || '(empty string)'}`);
        }
    }

    clear() {
        this.active = false;
        this.callId = '';
        this.functionName = '';
        this.argumentsText = '';
    }

    protected abstract extractFromChunk(chunk: T): PartialToolCallInfo | null;
}
