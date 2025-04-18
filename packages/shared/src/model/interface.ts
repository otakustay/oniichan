import type {ModelFeature} from './feature';

export interface ChatUserMessagePayload {
    role: 'user';
    content: string;
}

export interface ChatAssistantMessagePayload {
    role: 'assistant';
    content: string;
}

export type ChatInputPayload = ChatUserMessagePayload | ChatAssistantMessagePayload;

export interface ModelConfiguration {
    modelName: string;
    apiKey: string;
}

export interface ModelTextResponse {
    type: 'text';
    content: string;
}

export interface ModelReasoningResponse {
    type: 'reasoning';
    content: string;
}

export type ModelResponse = ModelTextResponse | ModelReasoningResponse;

export interface ModelMetaResponse {
    type: 'meta';
    providerRequestId: string;
    requestDetail: () => Promise<ModelRequestDetail>;
}

export type ModelStreamingResponse = ModelResponse | ModelMetaResponse;

export interface ModelRequestDetail {
    model: string;
    finishReason: string;
    inputTokens: number | null;
    reasoningTokens: number | null;
    outputTokens: number | null;
}

export interface ModelChatOptions {
    messages: ChatInputPayload[];
    systemPrompt?: string | undefined;
    abortSignal?: AbortSignal | undefined;
    overrideModelName?: string;
}

export interface ModelClient {
    chat(options: ModelChatOptions): Promise<[ModelTextResponse, ModelMetaResponse]>;
    chatStreaming(options: ModelChatOptions): AsyncIterable<ModelStreamingResponse>;
    getModelName(): string;
    getModelFeature(): ModelFeature;
}
