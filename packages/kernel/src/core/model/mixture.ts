import {ModelClient, ModelResponse, ModelFeature, ChatInputPayload} from '@oniichan/shared/model';
import {ModelChatOptions, ModelAccess} from './interface';
import {isAbortError} from '@oniichan/shared/error';

export class MixtureModelAccess implements ModelAccess {
    private readonly reasoningClient: ModelClient;

    private readonly textingClient: ModelClient;

    constructor(reasoningClient: ModelClient, textingClient: ModelClient) {
        this.reasoningClient = reasoningClient;
        this.textingClient = textingClient;
    }

    async getModelFeature(): Promise<ModelFeature> {
        return this.textingClient.getModelFeature();
    }

    async chat(): Promise<never> {
        throw new Error('Chat is not supported in mode mixture mode');
    }

    async *chatStreaming(options: ModelChatOptions): AsyncIterable<ModelResponse> {
        const {messages, telemetry} = options;
        telemetry.setRequest(messages);

        const reasoning = {
            text: '',
        };

        try {
            for await (const chunk of this.fetchReasoning(options)) {
                switch (chunk.type) {
                    case 'reasoning':
                        reasoning.text += chunk.content;
                        yield chunk;
                        break;
                }
            }

            for await (const chunk of this.fetchTexting(options, reasoning.text)) {
                telemetry.setResponseChunk(chunk);

                if (chunk.type !== 'meta') {
                    yield chunk;
                }
            }
        }
        finally {
            void telemetry.record();
        }
    }

    private addReasoningTextToUserRequest(messages: ChatInputPayload[], reasoningText: string) {
        const userRequest = messages.at(-1);

        if (userRequest?.role !== 'user' || !reasoningText.trim()) {
            return messages;
        }

        const paragraphs = [
            '# Helpful Thoughts',
            'Here are some helpful thoughts about user\'s request.',
            reasoningText,
            '# User Message',
            'This is the original user message content, you should directly respond to it based on the helpful thoughts.',
            userRequest.content,
        ];
        return [...messages.slice(0, -1), {...userRequest, content: paragraphs.join('\n\n')}];
    }

    private async *fetchReasoning(options: ModelChatOptions) {
        const abortController = new AbortController();
        const request = {
            messages: options.messages,
            systemPrompt: options.systemPrompt,
            abortSignal: abortController.signal,
        };
        try {
            for await (const chunk of this.reasoningClient.chatStreaming(request)) {
                options.telemetry.setResponseChunk(chunk);

                if (chunk.type === 'text') {
                    abortController.abort();
                    return;
                }

                yield chunk;
            }
        }
        catch (ex) {
            if (!isAbortError) {
                throw ex;
            }
        }
    }

    private async *fetchTexting(options: ModelChatOptions, reasoningText: string) {
        const request = {
            messages: this.addReasoningTextToUserRequest(options.messages, reasoningText),
            systemPrompt: options.systemPrompt,
            abortSignal: options.abortSignal,
        };
        yield* this.textingClient.chatStreaming(request);
    }
}
