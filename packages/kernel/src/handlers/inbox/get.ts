import type {MessageThreadData} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler.js';

export class InboxGetThreadListHandler extends RequestHandler<void, MessageThreadData[]> {
    static readonly action = 'inboxGetThreadList';

    async *handleRequest(): AsyncIterable<MessageThreadData[]> {
        const {logger, store} = this.context;
        logger.info('Start');

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxGetThreadList');
        yield store.dump();
        telemetry.end();

        logger.info('Finish');
    }
}
