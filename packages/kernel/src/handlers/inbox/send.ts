import {over} from '@otakustay/async-iterator';
import {DebugMessageLevel, MessageThread, Roundtrip, UserRequestMessage} from '@oniichan/shared/inbox';
import {StreamingToolParser, ToolParsedChunk} from '@oniichan/shared/tool';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {ModelChatOptions} from '../../editor';
import {detectWorkflow, DetectWorkflowOptions} from '../../workflow';
import {RequestHandler} from '../handler';
import {store} from './store';
import {SystemPromptGenerator} from './prompt';
import {CustomConfig, readCustomConfig} from '../../core/config';

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
    value: ToolParsedChunk;
}

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static readonly action = 'inboxSendMessage';

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    private thread: MessageThread = new MessageThread(newUuid());

    private roundtrip: Roundtrip = new Roundtrip(new UserRequestMessage(newUuid(), ''));

    private customConfig: CustomConfig = {
        embeddingRepoId: '',
        embeddingOnQuery: false,
        embeddingAsTool: false,
        embeddingContextMode: 'chunk',
        minEmbeddingDistance: 0,
        rootEntriesOnQuery: false,
    };

    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost, this.customConfig);

    private systemPrompt = '';

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger} = this.context;
        logger.info('Start', payload);

        logger.trace('EnsureRoundtrip');
        this.thread = store.ensureThread(payload.threadUuid);
        this.roundtrip = this.thread.startRoundtrip(new UserRequestMessage(payload.uuid, payload.body.content));

        logger.trace('PushStoreUpdate');
        store.moveThreadToTop(this.thread.uuid);
        this.updateInboxThreadList(store.dump());

        try {
            yield* this.telemetry.spyStreaming(() => this.chat());
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
        }
    }

    private async *requestModel(): AsyncIterable<InboxSendMessageResponse> {
        const {logger, editorHost} = this.context;
        const messages = this.thread.toMessages();
        const reply = this.roundtrip.startTextResponse(newUuid());

        logger.trace('RequestModelStart', {threadUuid: this.thread.uuid, messages});
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = this.telemetry.createModelTelemetry(this.getTaskId());
        const options: ModelChatOptions = {
            messages: messages.map(v => v.toChatInputPayload()).filter(v => !!v),
            telemetry: modelTelemetry,
            systemPrompt: this.systemPrompt,
        };
        const parser = new StreamingToolParser();
        const stream = over(model.chatStreaming(options)).map(v => v.content);

        try {
            for await (const chunk of parser.parse(stream)) {
                logger.trace('RequestModelChunk', chunk);
                yield {replyUuid: reply.uuid, value: chunk};
                // We update the store but don't broadcast to all views on streaming
                reply.addChunk(chunk);

                if (chunk.type !== 'text') {
                    this.updateInboxThreadList(store.dump());
                }
            }

            logger.trace('RequestModelFinish');

            const workflowOptions: DetectWorkflowOptions = {
                threadUuid: this.thread.uuid,
                taskId: this.getTaskId(),
                roundtrip: this.roundtrip,
                editorHost: this.context.editorHost,
                onUpdateThread: () => this.updateInboxThreadList(store.dump()),
            };
            const workflowRunner = detectWorkflow(workflowOptions);

            if (workflowRunner) {
                logger.trace('RunWorkflow', {originUuid: reply.uuid});
                const success = await workflowRunner.run();
                if (success) {
                    yield* this.requestModel();
                }
            }
        }
        catch (ex) {
            reply.setError(stringifyError(ex));
            logger.error('RequestModelFail', {reason: stringifyError(ex)});
            throw ex;
        }
        finally {
            // Broadcast update when message is fully generated
            logger.trace('MarkMessageUnread', {threadUuid: this.thread.uuid, messageUuid: reply.uuid});
            reply.markStatus('unread');
            logger.trace('PushStoreUpdate');
            store.moveThreadToTop(this.thread.uuid);
            this.updateInboxThreadList(store.dump());
        }
    }

    private async prepareSystemPrompt() {
        const {logger} = this.context;
        logger.trace('PrepareSystemPromptStart');

        this.systemPromptGenerator.setCustomConfig(this.customConfig);
        for await (const item of this.systemPromptGenerator.renderSystemPrompt(this.roundtrip.getRequestText())) {
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
        this.customConfig = await readCustomConfig(this.context.editorHost);
        await this.prepareSystemPrompt();

        this.addDebugMessage('info', 'System Prompt', this.systemPrompt);

        yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
    }

    private addDebugMessage(level: DebugMessageLevel, title: string, message: string) {
        this.roundtrip.addDebugMessage(newUuid(), level, title, message);
        this.updateInboxThreadList(store.dump());
    }
}
