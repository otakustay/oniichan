// import {AsyncIteratorController} from '@otakustay/async-iterator';
// import {createParser, EventSourceMessage} from 'eventsource-parser';
import {Anthropic} from '@anthropic-ai/sdk';
import {getModelConfiguration} from '../utils/config';

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

export async function chat(messages: ChatMessagePayload[]): Promise<string> {
    const config = getModelConfiguration()
    const client = new Anthropic({apiKey: config.apiKey, baseURL: config.baseUrl});
    const params: Anthropic.MessageCreateParams = {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 100,
        messages,
    };
    const result = await client.messages.create(params);
    return result.content.filter(v => v.type === 'text').map(v => v.text).join('\n\n');
}
