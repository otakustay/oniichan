import type {ModelResponse, ModelFeature, ChatInputPayload, ModelTextResponse} from '@oniichan/shared/model';
import type {ModelUsageTelemetry} from '@oniichan/storage/telemetry';

export interface ModelChatOptions {
    messages: ChatInputPayload[];
    telemetry: ModelUsageTelemetry;
    systemPrompt?: string;
    abortSignal?: AbortSignal;
    overrideModelName?: string;
}

export interface ModelAccess {
    getModelFeature(): Promise<ModelFeature>;
    chat(options: ModelChatOptions): Promise<ModelTextResponse>;
    chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse>;
}
