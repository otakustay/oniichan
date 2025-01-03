export interface ChatUserMessagePayload {
    role: 'user';
    content: string;
}

export interface ChatAssistantToolCallPayload {
    id: string;
    functionName: string;
    arguments: unknown;
}

export interface ChatAssistantMessagePayload {
    role: 'assistant';
    content: string;
    toolCall?: ChatAssistantToolCallPayload;
}

export interface ChatToolCallPayload {
    role: 'tool';
    callId: string;
    content: unknown;
}

export type ChatInputPayload = ChatUserMessagePayload | ChatAssistantMessagePayload | ChatToolCallPayload;

export type ModelApiStyle = 'OpenAI' | 'Anthropic';

export interface ModelConfiguration {
    apiStyle: ModelApiStyle;
    modelName: string;
    baseUrl: string;
    apiKey: string;
}

export interface ModelTextResponse {
    type: 'text';
    content: string;
}

export interface ModelToolResponse {
    type: 'tool';
    id: string;
    name: string;
    arguments: unknown;
}

export interface ModelMetaResponse {
    type: 'meta';
    model: string;
    usage: ModelUsage;
}

export type ModelResponse = ModelTextResponse | ModelToolResponse;

export type ModelStreamingResponse = ModelResponse | ModelMetaResponse;

export interface ModelUsage {
    inputTokens: number | null;
    outputTokens: number | null;
}

export interface ChatToolParameterSchema {
    type: 'object';
    properties?: unknown;
    [k: string]: unknown;
}

export interface ChatToolPayload {
    name: string;
    description: string;
    parameters: ChatToolParameterSchema;
}

export interface ModelChatOptions {
    messages: ChatInputPayload[];
    systemPrompt?: string | undefined;
    tools?: ChatToolPayload[];
}

export interface ModelClient {
    chat(options: ModelChatOptions): Promise<[ModelResponse, ModelMetaResponse]>;
    chatStreaming(options: ModelChatOptions): AsyncIterable<ModelStreamingResponse>;
}
