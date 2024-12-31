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
        if (info) {
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
    }

    isActive() {
        return this.active;
    }

    toToolResponse(): ModelToolResponse {
        return {
            type: 'tool',
            id: this.callId,
            name: this.functionName,
            arguments: JSON.parse(this.argumentsText),
        };
    }

    clear() {
        this.active = false;
        this.callId = '';
        this.functionName = '';
        this.argumentsText = '';
    }

    protected abstract extractFromChunk(chunk: T): PartialToolCallInfo | null;
}
