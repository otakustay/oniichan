import {MessageThreadPersistData} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';
import {store} from './store';

export class InboxDumpHandler extends RequestHandler<void, MessageThreadPersistData[]> {
    static readonly action = 'inboxDump';

    async *handleRequest(): AsyncIterable<MessageThreadPersistData[]> {
        const {logger} = this.context;
        logger.info('Start');
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxDump');
        yield store.persist();
        telemetry.end();
        logger.info('Finish');
    }
}
