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

interface PartialTextInfo {
    type: 'text';
    content: string;
}

interface PartialToolCallInfo {
    type: 'tool';
    id?: string | undefined;
    functionName?: string | undefined;
    argumentsDelta?: string | undefined;
}

export type ToolRecordChunk = PartialTextInfo | PartialToolCallInfo;

function isReasoned(value: any): value is {reason: string} {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return typeof value?.reason === 'string';
}

export abstract class StreamToolCallRecord<T> {
    private active = false;

    private thought = '';

    private callId = '';

    private functionName = '';

    private argumentsText = '';

    record(chunk: T) {
        const info = this.extractFromChunk(chunk);

        if (info.type === 'text') {
            // Record all text response before a tool call, it is a better reason than the `reason` field in json
            if (!this.active) {
                this.thought += info.content;
            }
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
                hasThought: !!this.thought,
                reason: isReasoned(args) ? args.reason : '',
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

    protected abstract extractFromChunk(chunk: T): ToolRecordChunk;
}
