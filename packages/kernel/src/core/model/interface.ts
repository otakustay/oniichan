import {ModelResponse, ModelFeature, ChatInputPayload, ModelTextResponse} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';

export interface ModelChatOptions {
    messages: ChatInputPayload[];
    telemetry: ModelUsageTelemetry;
    systemPrompt?: string;
    abortSignal?: AbortSignal;
}

export interface ModelAccess {
    getModelFeature(): Promise<ModelFeature>;
    chat(options: ModelChatOptions): Promise<ModelTextResponse>;
    chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse>;
}
