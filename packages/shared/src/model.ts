// import {AsyncIteratorController} from '@otakustay/async-iterator';
// import {createParser, EventSourceMessage} from 'eventsource-parser';
import {Anthropic} from '@anthropic-ai/sdk';
import OpenAi from 'openai';

export interface ChatMessagePayload {
    role: 'user' | 'assistant';
    content: string;
}

// async function fireEventSourceRequest<T>(messages: Anthropic.MessageParam[], controller: AsyncIteratorController<T>) {
//     const params: Anthropic.MessageCreateParams = {
//         model: 'claude-3-5-sonnet-latest',
//         max_tokens: 100,
//         messages,
//         stream: true,
//     };
//     const stream = await client.messages.create(params);

//     const onEvent = (event: EventSourceMessage) => {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//         controller.put(JSON.parse(event.data));
//     };
//     const parser = createParser({onEvent});
//     const decoder = new TextDecoder('utf-8');
//     const reader = stream.toReadableStream().getReader();

//     // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
//     while (true) {
//         const result = await reader.read();

//         if (result.done) {
//             break;
//         }

//         parser.feed(decoder.decode(result.value as Uint8Array));
//     }
// }

// export function chatStream(messages: ChatMessagePayload[]) {
//     const controller = new AsyncIteratorController();
//     fireEventSourceRequest(messages, controller).catch((ex: unknown) => controller.error(ex));
//     return controller.toIterable();
// }

export type ModelApiStyle = 'OpenAI' | 'Anthropic';

export interface ModelConfiguration {
    apiStyle: ModelApiStyle;
    modelName: string;
    baseUrl: string;
    apiKey: string;
}

function validateModelConfiguration(config: ModelConfiguration): void {
    if (!config.modelName) {
        throw new Error('Require modelName to create a model client');
    }

    if (!config.apiKey) {
        throw new Error('Require apiKey to create a model client');
    }

    if (!config.baseUrl) {
        throw new Error('Require baseUrl to create a model client');
    }
}

export interface ModelClient {
    chat: (messages: ChatMessagePayload[]) => Promise<string>;
}

export function createModelClient(config: ModelConfiguration): ModelClient {
    validateModelConfiguration(config);

    const {apiStyle, modelName, baseUrl, apiKey} = config;

    if (apiStyle === 'Anthropic') {
        const client = new Anthropic({apiKey, baseURL: baseUrl});
        return {
            chat: async messages => {
                const params: Anthropic.MessageCreateParams = {
                    messages,
                    model: modelName,
                    max_tokens: 1000,
                };
                const result = await client.messages.create(params);
                return result.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n');
            },
        };
    }
    else {
        const client = new OpenAi({apiKey, baseURL: baseUrl});
        return {
            chat: async messages => {
                const response = await client.chat.completions.create({
                    messages,
                    model: modelName,
                    max_tokens: 1000,
                });
                return response.choices[0]?.message?.content ?? '';
            },
        };
    }
}
