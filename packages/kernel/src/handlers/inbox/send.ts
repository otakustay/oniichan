import {over} from '@otakustay/async-iterator';
import {EmbeddingSearchResultItem, MessageThread, Roundtrip, UserRequestMessage} from '@oniichan/shared/inbox';
import {builtinTools, StreamingToolParser, ToolParsedChunk} from '@oniichan/shared/tool';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {ModelChatOptions} from '../../editor';
import {detectWorkflow, DetectWorkflowOptions} from '../../workflow';
import {RequestHandler} from '../handler';
import {store} from './store';
import {renderSystemPrompt} from './prompt';
import {CustomConfig, readCustomConfig} from '../../core/config';
import {searchEmbedding} from '../../core/embedding';

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

    private embeddingSearchResults: EmbeddingSearchResultItem[] = [];

    private customConfig: CustomConfig = {
        embeddingRepoId: '',
        embeddingOnQuery: false,
        embeddingAsTool: false,
        embeddingContextMode: 'chunk',
        minEmbeddingDistance: 0,
    };

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger} = this.context;
        logger.info('Start', payload);

        this.customConfig = await readCustomConfig(this.context.editorHost);

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
        const {logger} = this.context;
        const renderOptions = {tools: builtinTools, embeddingSearchResults: this.embeddingSearchResults};
        const systemPrompt = await renderSystemPrompt(renderOptions, this.customConfig);
        const messages = this.thread.toMessages();
        const reply = this.roundtrip.startTextResponse(newUuid());

        logger.trace('RequestModelStart', {threadUuid: this.thread.uuid, messages, systemPrompt});
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = this.telemetry.createModelTelemetry(this.getTaskId());
        const options: ModelChatOptions = {
            messages: messages.map(v => v.toChatInputPayload()),
            telemetry: modelTelemetry,
            systemPrompt,
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

    private async applyEmbeddingSearch() {
        const {editorHost} = this.context;

        if (!this.customConfig.embeddingOnQuery) {
            return true;
        }

        const debug = this.roundtrip.startDebugMessage(newUuid());
        debug.markStatus('read');

        if (!this.customConfig.embeddingRepoId) {
            const warnning = {
                type: 'text',
                content:
                    '⚠️ Embedding search is enabled, but no repo id is provided, please set `embeddingRepoId` in your `.oniichan/config.json` in project root',
            } as const;
            debug.addChunk(warnning);
            this.updateInboxThreadList(store.dump());
            return false;
        }

        const query = this.roundtrip.getRequestText();
        try {
            const results = await searchEmbedding(query, {config: this.customConfig, editorHost});
            this.embeddingSearchResults.push(...results);
            debug.addEmbeddingSearchResult(query, results);
            this.updateInboxThreadList(store.dump());
            return true;
        }
        catch (ex) {
            debug.addChunk({type: 'text', content: `Searching embedding for query: ${query}`});
            debug.setError(stringifyError(ex));
            this.updateInboxThreadList(store.dump());
            return false;
        }
    }

    private async *chat() {
        const allowContinue = await this.applyEmbeddingSearch();

        if (!allowContinue) {
            return;
        }

        yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
    }
}
