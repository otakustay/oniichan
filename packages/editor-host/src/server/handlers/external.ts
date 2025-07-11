import open from 'open';
import {RequestHandler} from './handler.js';

export class OpenUrlHandler extends RequestHandler<string, void> {
    static readonly action = 'openUrl';

    // eslint-disable-next-line require-yield
    async *handleRequest(url: string): AsyncIterable<void> {
        const {logger} = this.context;
        logger.info('Start', {url});

        // It's really complicated to open an externally hosted URL in VSCode webview, use browser application instead
        await open(url);

        logger.info('Finish');
    }
}
