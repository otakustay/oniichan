import {RequestHandler} from './handler.js';

export class OpenUrlHandler extends RequestHandler<string, void> {
    static readonly action = 'openUrl';

    async *handleRequest(): AsyncIterable<void> {
    }
}
