import {over} from '@otakustay/async-iterator';
import {DebugMessageLevel, DebugContentChunk, ReasoningMessageChunk, MessageInputChunk} from '@oniichan/shared/inbox';
import {duplicate, merge} from '@oniichan/shared/iterable';
import {ModelResponse} from '@oniichan/shared/model';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {MessageThread, Roundtrip, UserRequestMessage} from '../../inbox';
import {ModelChatOptions} from '../../core/model';
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
}

export interface InboxSendMessageResponse {
    replyUuid: string;
    value: MessageInputChunk;
}

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static readonly action = 'inboxSendMessage';

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    private thread: MessageThread = new MessageThread(newUuid());

    private roundtrip: Roundtrip = new Roundtrip();

    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost);

    private systemPrompt = '';

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger, store} = this.context;
        logger.info('Start', payload);

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);
        this.roundtrip.setRequest(new UserRequestMessage(payload.uuid, this.roundtrip, payload.body.content));
        this.thread.addRoundtrip(this.roundtrip);
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
        const {logger, modelAccess, editorHost, commandExecutor, store} = this.context;
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
        const chatStream = modelAccess.chatStreaming(options);

        try {
            for await (const chunk of this.consumeChatStream(chatStream)) {
                // We update the store but don't broadcast to all views on streaming
                reply.addChunk(chunk);
                yield {replyUuid: reply.uuid, value: chunk};

                // Less frequently flush message to frontend
                if (chunk.type !== 'text' && chunk.type !== 'reasoning') {
                    this.updateInboxThreadList(store.dump());
                }
            }
        }
        catch (ex) {
            reply.setError(stringifyError(ex));
            logger.error('RequestModelFail', {reason: stringifyError(ex)});
            throw ex;
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
            modelAccess,
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

    private async prepareSystemPrompt() {
        const {logger, modelAccess} = this.context;
        logger.trace('PrepareSystemPromptStart');

        const modelFeature = await modelAccess.getModelFeature();
        this.systemPromptGenerator.setModelFeature(modelFeature);
        for await (const item of this.systemPromptGenerator.renderSystemPrompt()) {
            switch (item.type) {
                case 'debug':
                    this.addDebugMessage(item.level, item.title, item.message);
                    break;
                case 'result':
                    this.systemPrompt = item.prompt;
                    break;
                default:
                    assertNever<{type: string}>(item, v => `Unknown system prompt yield type ${v.type}`);
            }
        }

        logger.trace('PrepareSystemPromptFinish', {systemPrompt: this.systemPrompt});
    }

    private async *chat() {
        await this.prepareSystemPrompt();

        this.addDebugMessage('info', 'System Prompt', {type: 'plainText', content: this.systemPrompt});

        yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
    }

    private addDebugMessage(level: DebugMessageLevel, title: string, content: DebugContentChunk) {
        const {store} = this.context;
        this.roundtrip.addDebugMessage(newUuid(), level, title, content);
        this.updateInboxThreadList(store.dump());
    }
}
