import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import {InboxRequestHandler} from './handler.js';
import type {InboxMessageResponse, InboxRoundtripIdentity} from './handler.js';

export interface InboxApproveToolRequest extends InboxRoundtripIdentity {
    approved: boolean;
}

export class InboxApproveToolHandler extends InboxRequestHandler<InboxApproveToolRequest, InboxMessageResponse> {
    static readonly action = 'inboxApproveTool';

    async *handleRequest(payload: InboxApproveToolRequest): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        logger.info('Start', payload);

        try {
            yield* this.telemetry.spyStreaming(() => this.continueWorkflow(payload));
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
        }
        finally {
            logger.trace(
                'MarkRoundtripUnread',
                {threadUuid: this.thread.uuid, messageUuid: payload.requestMessageUuid}
            );
            this.roundtrip.markStatus('unread');

            this.pushStoreUpdate(this.thread.uuid);
        }
    }

    private async *continueWorkflow(payload: InboxApproveToolRequest) {
        const {store, logger} = this.context;
        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.findThreadByUuidStrict(payload.threadUuid);

        logger.trace('PrepareOriginMessage');
        this.roundtrip = this.thread.findRoundtripByMessageUuidStrict(payload.requestMessageUuid);
        const latestWorkflow = this.roundtrip.getLatestWorkflowStrict();
        const origin = latestWorkflow.getOriginMessage();

        if (origin.getWorkflowOriginStatus() !== 'waitingApprove') {
            throw new Error('Workflow is not in a waiting approve state');
        }

        const status = payload.approved ? 'userApproved' : 'userRejected';
        origin.markWorkflowOriginStatus(status);
        this.pushStoreUpdate();

        const runner = await this.detectWorkflowRunner();

        if (!runner) {
            throw new Error('No available tool workflow');
        }
        yield* over(this.runWorkflow(runner)).map(v => ({type: 'value', value: v} as const));
    }
}
