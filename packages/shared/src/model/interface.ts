export interface ChatMessagePayload {
    role: 'user' | 'assistant';
    content: string;
}

export type ModelApiStyle = 'OpenAI' | 'Anthropic';

export interface ModelConfiguration {
    apiStyle: ModelApiStyle;
    modelName: string;
    baseUrl: string;
    apiKey: string;
}

export interface ModelUsage {
    inputTokens: number | null;
    outputTokens: number | null;
}

export interface ModelResponseMeta {
    model: string;
    usage: ModelUsage;
}

export interface ModelClient {
    chat(messages: ChatMessagePayload[]): Promise<[string, ModelResponseMeta]>;
    chatStreaming(messages: ChatMessagePayload[]): AsyncIterable<string | ModelResponseMeta>;
}
