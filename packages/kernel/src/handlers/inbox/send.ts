import {over} from '@otakustay/async-iterator';
import {MessageInputChunk} from '@oniichan/shared/inbox';
import {stringifyError} from '@oniichan/shared/error';
import {InboxPromptReference} from '@oniichan/prompt';
import {newUuid} from '@oniichan/shared/id';
import {MessageThread, Roundtrip, UserRequestMessage} from '../../inbox';
import {WorkflowDetector, WorkflowDetectorInit} from '../../workflow';
import {InboxRequestHandler} from './handler';

interface TextMessageBody {
    type: 'text';
    content: string;
}

type MessageBody = TextMessageBody;

export interface InboxSendMessageRequest {
    threadUuid: string;
    uuid: string;
    body: MessageBody;
    references?: InboxPromptReference[];
}

export interface InboxSendMessageResponse {
    replyUuid: string;
    value: MessageInputChunk;
}

export class InboxSendMessageHandler extends InboxRequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static readonly action = 'inboxSendMessage';

    private thread: MessageThread = new MessageThread(newUuid());

    private roundtrip: Roundtrip = new Roundtrip();

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger, store} = this.context;
        logger.info('Start', payload);

        try {
            yield* this.telemetry.spyStreaming(() => this.chat(payload));
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
        }
        finally {
            logger.trace('MarkRoundtripUnread', {threadUuid: this.thread.uuid, messageUuid: payload.uuid});
            this.roundtrip.markStatus('unread');

            logger.trace('PushStoreUpdate');
            store.moveThreadToTop(this.thread.uuid);
            this.updateInboxThreadList(store.dump());
        }
    }

    private async *requestModel(): AsyncIterable<InboxSendMessageResponse> {
        const reply = this.roundtrip.startTextResponse(newUuid());

        this.pushStoreUpdate();

        yield* this.requestModelChat(this.thread, reply);
        yield* this.detectAndRunWorkflow();
    }

    private async *detectAndRunWorkflow() {
        const {logger, editorHost, commandExecutor, store} = this.context;
        const detectorInit: WorkflowDetectorInit = {
            threadUuid: this.thread.uuid,
            taskId: this.getTaskId(),
            systemPrompt: this.systemPrompt,
            roundtrip: this.roundtrip,
            telemetry: this.telemetry,
            modelAccess: this.modelAccess,
            editorHost,
            commandExecutor,
            logger,
            onUpdateThread: () => this.updateInboxThreadList(store.dump()),
        };
        const detector = new WorkflowDetector(detectorInit);
        const workflowRunner = await detector.detectWorkflow();

        if (workflowRunner) {
            // Detecting workflow can change message content, such as move a text message to tool call message
            this.pushStoreUpdate();

            try {
                const reply = workflowRunner.getWorkflow().getOriginMessage();
                logger.trace('RunWorkflow', {originUuid: reply.uuid});
                await workflowRunner.run();
                logger.trace('RunWorkflowFinish');
            }
            catch (ex) {
                logger.error('RunWorkflowFail', {reason: stringifyError(ex)});
            }
            finally {
                this.pushStoreUpdate(this.thread.uuid);
            }

            if (workflowRunner.getWorkflow().shouldContinueRoundtrip()) {
                yield* this.requestModel();
            }
        }
    }

    private async *chat(payload: InboxSendMessageRequest) {
        const {store, logger} = this.context;
        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);
        this.roundtrip.setRequest(new UserRequestMessage(payload.uuid, this.roundtrip, payload.body.content));
        this.thread.addRoundtrip(this.roundtrip);
        this.addReference(payload.references ?? []);
        store.moveThreadToTop(this.thread.uuid);

        await this.prepareSystemPrompt();
        yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
    }
}
