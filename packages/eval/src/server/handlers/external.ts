import {RequestHandler} from './handler';

export class OpenUrlHandler extends RequestHandler<string, void> {
    static readonly action = 'openUrl';

    async *handleRequest(): AsyncIterable<void> {
    }
}
