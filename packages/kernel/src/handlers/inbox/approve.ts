import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import {InboxRequestHandler, InboxMessageResponse, InboxRoundtripIdentity} from './handler';
import {ToolCallWorkflowRunner, ToolCallWorkflowRunnerInit} from '../../workflow';

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
        const {store, logger, editorHost, commandExecutor} = this.context;
        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);

        logger.trace('PrepareOriginMessage');
        this.roundtrip = this.thread.findRoundtripByMessageUuidStrict(payload.requestMessageUuid);
        const latestWorkflow = this.roundtrip.getLatestWorkflowStrict();
        const origin = latestWorkflow.getOriginMessage();

        if (origin.getToolCallStatus() !== 'waitingApprove') {
            throw new Error('Workflow is not in a waiting approve state');
        }

        const status = payload.approved ? 'userApproved' : 'userRejected';
        origin.markToolCallStatus(status);
        this.pushStoreUpdate();

        const toolCallMessage = latestWorkflow.getOriginMessage();
        const messages = this.roundtrip.toMessages();

        await this.prepareSystemPrompt();
        const init: ToolCallWorkflowRunnerInit = {
            threadUuid: this.thread.uuid,
            taskId: this.getTaskId(),
            base: messages.filter(v => v !== toolCallMessage),
            origin: toolCallMessage,
            workflow: latestWorkflow,
            telemetry: this.telemetry,
            systemPrompt: this.systemPrompt,
            modelAccess: this.modelAccess,
            editorHost,
            commandExecutor,
            logger,
            onUpdateThread: () => this.pushStoreUpdate(),
        };
        const runner = new ToolCallWorkflowRunner(init);
        const mode = payload.approved ? 'run' : 'reject';
        yield* over(this.runWorkflow(runner, mode)).map(v => ({type: 'value', value: v} as const));
    }
}
