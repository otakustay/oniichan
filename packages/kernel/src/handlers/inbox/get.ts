import {MessageThread} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';
import {store} from './store';

export class InboxGetThreadListHandler extends RequestHandler<void, MessageThread[]> {
    static readonly action = 'inboxGetThreadList';

    async *handleRequest(): AsyncIterable<MessageThread[]> {
        const {logger} = this.context;
        logger.info('Start');
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxGetThreadList');
        yield store.dump();
        telemetry.end();
        logger.info('Finish');
    }
}
