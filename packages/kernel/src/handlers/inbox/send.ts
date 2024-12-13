import {over} from '@otakustay/async-iterator';
import {ReasoningMessageChunk, MessageInputChunk} from '@oniichan/shared/inbox';
import {duplicate, merge} from '@oniichan/shared/iterable';
import {ModelResponse} from '@oniichan/shared/model';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {stringifyError} from '@oniichan/shared/error';
import {InboxConfig} from '@oniichan/editor-host/protocol';
import {InboxPromptReference} from '@oniichan/prompt';
import {newUuid} from '@oniichan/shared/id';
import {MessageThread, Roundtrip, UserRequestMessage} from '../../inbox';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {WorkflowDetector, WorkflowDetectorInit} from '../../workflow';
import {RequestHandler} from '../handler';
import {SystemPromptGenerator} from './prompt';

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

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static readonly action = 'inboxSendMessage';

    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost, this.context.logger);

    private inboxConfig: InboxConfig = {enableDeepThink: false};

    private modelAccess = new ModelAccessHost(this.context.editorHost, {enableDeepThink: false});

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    private thread: MessageThread = new MessageThread(newUuid());

    private roundtrip: Roundtrip = new Roundtrip();

    private references: InboxPromptReference[] = [];

    private systemPrompt = '';

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger, store} = this.context;
        logger.info('Start', payload);

        await this.prepareEnvironment();

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);
        this.roundtrip.setRequest(new UserRequestMessage(payload.uuid, this.roundtrip, payload.body.content));
        this.thread.addRoundtrip(this.roundtrip);
        this.references = payload.references ?? [];
        store.moveThreadToTop(this.thread.uuid);

        try {
            yield* this.telemetry.spyStreaming(() => this.chat());
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

    private consumeChatStream(chatStream: AsyncIterable<ModelResponse>): AsyncIterable<MessageInputChunk> {
        const parser = new StreamingToolParser();
        const [reasoningFork, textFork] = duplicate(chatStream);
        const reasonineStream = over(reasoningFork)
            .filter(v => v.type === 'reasoning')
            .map((v: ModelResponse): ReasoningMessageChunk => ({type: 'reasoning', content: v.content}));
        const textStream = over(textFork).filter(v => v.type === 'text').map(v => v.content);
        return merge(reasonineStream, parser.parse(textStream));
    }

    private async *requestModel(): AsyncIterable<InboxSendMessageResponse> {
        const {logger, editorHost, commandExecutor, store} = this.context;
        const messages = this.thread.toMessages();
        const reply = this.roundtrip.startTextResponse(newUuid());

        logger.trace('PushStoreUpdate');
        this.updateInboxThreadList(store.dump());

        logger.trace('RequestModelStart', {threadUuid: this.thread.uuid, messages});
        const modelTelemetry = this.telemetry.createModelTelemetry();
        const options: ModelChatOptions = {
            messages: messages.map(v => v.toChatInputPayload()).filter(v => !!v),
            telemetry: modelTelemetry,
            systemPrompt: this.systemPrompt,
        };
        const chatStream = this.modelAccess.chatStreaming(options);
        const state = {
            toolCallOccured: false,
        };

        // NOTE: We are not using `AbortSignal` to abort stream after tool call because this loses usage data
        try {
            for await (const chunk of this.consumeChatStream(chatStream)) {
                if (state.toolCallOccured) {
                    logger.trace('ChunkAfterToolCall', {chunk});
                    continue;
                }

                // We update the store but don't broadcast to all views on streaming
                reply.addChunk(chunk);
                yield {replyUuid: reply.uuid, value: chunk};

                // Less frequently flush message to frontend
                if (chunk.type !== 'text' && chunk.type !== 'reasoning') {
                    this.updateInboxThreadList(store.dump());
                }

                // Force at most one tool is used per response
                if (chunk.type === 'toolEnd') {
                    state.toolCallOccured = true;
                }
            }
        }
        finally {
            // Broadcast update when one message is fully generated
            logger.trace('PushStoreUpdate');
            store.moveThreadToTop(this.thread.uuid);
            this.updateInboxThreadList(store.dump());
        }

        logger.trace('RequestModelFinish');

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
            logger.trace('PushStoreUpdate');
            this.updateInboxThreadList(store.dump());

            try {
                logger.trace('RunWorkflow', {originUuid: reply.uuid});
                await workflowRunner.run();
                logger.trace('RunWorkflowFinish');
            }
            catch (ex) {
                logger.error('RunWorkflowFail', {reason: stringifyError(ex)});
            }
            finally {
                logger.trace('PushStoreUpdate');
                store.moveThreadToTop(this.thread.uuid);
                this.updateInboxThreadList(store.dump());
            }

            if (workflowRunner.getWorkflow().shouldContinueRoundtrip()) {
                yield* this.requestModel();
            }
        }
    }

    private async prepareEnvironment() {
        const {editorHost, logger} = this.context;

        logger.trace('PrepareInboxConfig');
        this.inboxConfig = await editorHost.call('getInboxConfig');

        logger.trace('PrepareModelAccess');
        this.modelAccess = new ModelAccessHost(editorHost, {enableDeepThink: this.inboxConfig.enableDeepThink});
    }

    private async prepareSystemPrompt() {
        const {logger} = this.context;
        logger.trace('PrepareSystemPromptStart');

        const modelFeature = await this.modelAccess.getModelFeature();
        this.systemPromptGenerator.addReference(this.references);
        this.systemPromptGenerator.setModelFeature(modelFeature);
        this.systemPrompt = await this.systemPromptGenerator.renderSystemPrompt();

        logger.trace('PrepareSystemPromptFinish', {systemPrompt: this.systemPrompt});
    }

    private async *chat() {
        await this.prepareSystemPrompt();
        yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
    }
}
