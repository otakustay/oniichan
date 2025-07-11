import {RequestHandler} from '../handler.js';

export class EchoHandler extends RequestHandler<string, string> {
    static readonly action = 'echo';

    async *handleRequest(request: string): AsyncIterable<string> {
        yield request;
    }
}
