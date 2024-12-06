// import {AsyncIteratorController} from '@otakustay/async-iterator';
// import {createParser, EventSourceMessage} from 'eventsource-parser';
import {Anthropic} from '@anthropic-ai/sdk';
import {getModelConfiguration} from '../utils/config';
import {notifyNotConfgured} from '../ui/notConfigured';

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

async function chat(client: Anthropic, messages: ChatMessagePayload[]): Promise<string> {
    const params: Anthropic.MessageCreateParams = {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 100,
        messages,
    };
    const result = await client.messages.create(params);
    return result.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n');
}

type ModelCall<P extends any[], R> = (client: Anthropic, ...args: P) => Promise<R>;

type UserModelCall<P extends any[], R> = (...args: P) => Promise<R>;

function withModelClient<P extends any[], R>(fn: ModelCall<P, R>): UserModelCall<P, R> {
    const state = {retry: 0};
    const implement = async (...args: P): Promise<R> => {
        const config = getModelConfiguration();

        if (config.apiKey) {
            const client = new Anthropic({apiKey: config.apiKey, baseURL: config.baseUrl});
            return fn(client, ...args);
        }

        const isApiKeyConfigured = await notifyNotConfgured();

        if (!isApiKeyConfigured || state.retry >= 1) {
            throw new Error('Anthropic API key not configured');
        }

        state.retry++;
        return implement(...args);
    };
    return implement;
}

export function createModelAccess() {
    return {
        chat: withModelClient(chat),
    };
}
