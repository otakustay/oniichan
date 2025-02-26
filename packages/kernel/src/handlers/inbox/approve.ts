import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import {InboxRequestHandler, InboxMessageResponse, InboxRoundtripIdentity} from './handler';

export class InboxApproveToolHandler extends InboxRequestHandler<InboxRoundtripIdentity, InboxMessageResponse> {
    static readonly action = 'inboxApproveTool';

    async *handleRequest(payload: InboxRoundtripIdentity): AsyncIterable<InboxMessageResponse> {
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

    private async *continueWorkflow(payload: InboxRoundtripIdentity) {
        const {store, logger} = this.context;
        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);

        logger.trace('PrepareOriginMessage');
        this.roundtrip = this.thread.findRoundtripByMessageUuidStrict(payload.requestMessageUuid);

        await this.prepareSystemPrompt();
        const workflowRunner = await this.detectWorkflowRunner();

        if (!workflowRunner) {
            throw new Error('Approved message does not contain a workflow');
        }

        yield* over(this.runWorkflow(workflowRunner)).map(v => ({type: 'value', value: v} as const));
    }
}
