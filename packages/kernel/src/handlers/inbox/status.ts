import {RoundtripStatus} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';
import {store} from './store';

export interface InboxMarkRoundtripStatusRequest {
    threadUuid: string;
    messageUuid: string;
    status: RoundtripStatus;
}

export class InboxMarkRoundtripStatusHandler extends RequestHandler<InboxMarkRoundtripStatusRequest, void> {
    static readonly action = 'inboxMarkMessageStatus';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: InboxMarkRoundtripStatusRequest): AsyncIterable<void> {
        const {logger} = this.context;
        logger.info('Start', payload);
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxMarkMessageStatus');
        telemetry.setTelemetryData('threadUuid', payload.threadUuid);
        telemetry.setTelemetryData('messageUuid', payload.messageUuid);
        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        const roudntrip = thread.findRoundtripByMessageUuidStrict(payload.messageUuid);
        roudntrip.markStatus(payload.status);
        logger.trace('PushStoreUpdate');
        this.updateInboxThreadList(store.dump());
        telemetry.end();
        logger.info('Finish');
    }
}
