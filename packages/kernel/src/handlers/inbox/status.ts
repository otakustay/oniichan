import {extractFileEdits, RoundtripStatus} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {InboxMessageIdentity, InboxRequestHandler, InboxRoundtripIdentity} from './handler';

export interface InboxMarkRoundtripStatusRequest extends InboxMessageIdentity {
    status: RoundtripStatus;
}

export class InboxMarkRoundtripStatusHandler extends InboxRequestHandler<InboxMarkRoundtripStatusRequest, void> {
    static readonly action = 'inboxMarkMessageStatus';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: InboxMarkRoundtripStatusRequest): AsyncIterable<void> {
        const {logger, store} = this.context;
        logger.info('Start', payload);

        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxMarkMessageStatus');
        telemetry.setTelemetryData('threadUuid', payload.threadUuid);
        telemetry.setTelemetryData('messageUuid', payload.messageUuid);
        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        const roudntrip = thread.findRoundtripByMessageUuidStrict(payload.messageUuid);
        roudntrip.markStatus(payload.status);
        this.pushStoreUpdate();
        telemetry.end();

        logger.info('Finish');
    }
}

export interface InboxCheckEditResponse {
    totalEditCount: number;
    appliedEditCount: number;
}

export class InboxCheckEditHandler extends InboxRequestHandler<InboxRoundtripIdentity, InboxCheckEditResponse> {
    static readonly action = 'inboxCheckEdit';

    async *handleRequest(payload: InboxRoundtripIdentity): AsyncIterable<InboxCheckEditResponse> {
        const {logger, editorHost, store} = this.context;
        logger.info('Start');

        const thread = store.findThreadByUuidStrict(payload.threadUuid);
        const roundtrip = thread.findRoundtripByMessageUuidStrict(payload.requestMessageUuid);
        const messages = roundtrip.toMessages().map(v => v.toMessageData());
        const edits = Object.values(extractFileEdits(messages)).filter(v => !!v);
        const appliableStates = await Promise.all(edits.map(v => editorHost.call('checkEditAppliable', v)));
        yield {
            totalEditCount: edits.length,
            appliedEditCount: appliableStates.filter(v => v === 'applied').length,
        };

        logger.info('Finish');
    }
}
