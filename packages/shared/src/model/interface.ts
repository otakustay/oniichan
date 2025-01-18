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

export interface ModelResponse {
    type: 'text';
    content: string;
}

export interface ModelMetaResponse {
    type: 'meta';
    model: string;
    usage: ModelUsage;
}

export type ModelStreamingResponse = ModelResponse | ModelMetaResponse;

export interface ModelUsage {
    inputTokens: number | null;
    outputTokens: number | null;
}

export interface ModelChatOptions {
    messages: ChatInputPayload[];
    systemPrompt?: string | undefined;
}

export interface ModelClient {
    chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]>;
    chatStreaming(options: ModelChatOptions): AsyncIterable<ModelStreamingResponse>;
}
