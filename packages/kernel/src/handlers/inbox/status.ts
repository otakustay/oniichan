import {MessageStatus} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';
import {store} from './store';

export interface InboxMarkMessageStatusRequest {
    threadUuid: string;
    uuid: string;
    status: MessageStatus;
}

export class InboxMarkMessageStatusHandler extends RequestHandler<InboxMarkMessageStatusRequest, void> {
    static readonly action = 'inboxMarkMessageStatus';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: InboxMarkMessageStatusRequest): AsyncIterable<void> {
        const {logger} = this.context;
        logger.info('Start', payload);
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxMarkMessageStatus');
        telemetry.setTelemetryData('threadUuid', payload.threadUuid);
        telemetry.setTelemetryData('uuid', payload.uuid);
        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        const message = thread.findMessageByUuidStrict(payload.uuid);
        message.markStatus(payload.status);
        logger.trace('PushStoreUpdate');
        this.updateInboxThreadList(store.dump());
        telemetry.end();
        logger.info('Finish');
    }
}
