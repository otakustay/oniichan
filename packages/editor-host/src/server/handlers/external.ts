import {RequestHandler} from '@otakustay/ipc';
import {Context} from '../interface';

export class OpenUrlHandler extends RequestHandler<string, void, Context> {
    static readonly action = 'openUrl';

    // eslint-disable-next-line require-yield
    async *handleRequest(url: string): AsyncIterable<void> {
        const {default: open} = await import('open');
        // It's really complicated to open an externally hosted URL in VSCode webview, use browser application instead
        await open(url);
    }
}
