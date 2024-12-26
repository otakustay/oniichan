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
    static action = 'inboxMarkMessageStatus' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: InboxMarkMessageStatusRequest): AsyncIterable<void> {
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxMarkMessageStatus');
        telemetry.setTelemetryData('threadUuid', payload.threadUuid);
        telemetry.setTelemetryData('uuid', payload.uuid);
        store.markStatus(payload.threadUuid, payload.uuid, payload.status);
        this.updateInboxThreadList(store.dump());
        telemetry.end();
    }
}
