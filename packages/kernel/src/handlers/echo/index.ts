import {RequestHandler} from '../handler';

export class EchoHandler extends RequestHandler<string, string> {
    static action = 'echo' as const;

    async *handleRequest(request: string): AsyncIterable<string> {
        yield request;
    }
}
