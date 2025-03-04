import {MessageThreadPersistData} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';

export class ExportInboxHandler extends RequestHandler<void, MessageThreadPersistData[]> {
    static readonly action = 'debugExportInbox';

    async *handleRequest(): AsyncIterable<MessageThreadPersistData[]> {
        const {logger, store} = this.context;
        logger.info('Start');

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'debugExportInbox');
        yield store.persist();
        telemetry.end();

        logger.info('Finish');
    }
}
