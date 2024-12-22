import {RequestHandler} from '@otakustay/ipc';
import {getModelConfig, isModelConfigValid} from '@oniichan/host/utils/config';
import {ChatMessagePayload, createModelClient} from '@oniichan/shared/model';

export class ModelChatHandler extends RequestHandler<ChatMessagePayload[], string> {
    static action = 'modelChat' as const;

    async *handleRequest(messages: ChatMessagePayload[]): AsyncIterable<string> {
        const config = getModelConfig();

        if (!isModelConfigValid(config)) {
            throw new Error('Invalid model config');
        }

        const client = createModelClient(config);
        for await (const chunk of client.chatStreaming(messages)) {
            if (typeof chunk === 'string') {
                yield chunk;
            }
        }
    }
}
