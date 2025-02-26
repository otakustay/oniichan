import {InboxConfig} from '@oniichan/editor-host/protocol';
import {InboxPromptReference} from '@oniichan/prompt';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {AssistantTextMessage, MessageThread} from '../../inbox';
import {RequestHandler} from '../handler';
import {SystemPromptGenerator} from './prompt';
import {ModelResponse} from '@oniichan/shared/model';
import {MessageInputChunk, ReasoningMessageChunk} from '@oniichan/shared/inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {duplicate, merge} from '@oniichan/shared/iterable';
import {over} from '@otakustay/async-iterator';

export abstract class InboxRequestHandler<I, O> extends RequestHandler<I, O> {
    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost, this.context.logger);

    private readonly references: InboxPromptReference[] = [];

    private inboxConfig: InboxConfig = {enableDeepThink: false};

    protected modelAccess = new ModelAccessHost(this.context.editorHost, {enableDeepThink: false});

    protected systemPrompt = '';

    protected addReference(references: InboxPromptReference[]) {
        this.references.push(...references);
    }

    protected async prepareEnvironment() {
        const {editorHost, logger} = this.context;

        logger.trace('PrepareInboxConfig');
        this.inboxConfig = await editorHost.call('getInboxConfig');

        logger.trace('PrepareModelAccess');
        this.modelAccess = new ModelAccessHost(editorHost, {enableDeepThink: this.inboxConfig.enableDeepThink});
    }

    protected async prepareSystemPrompt() {
        const {logger} = this.context;
        logger.trace('PrepareSystemPromptStart');

        const modelFeature = await this.modelAccess.getModelFeature();
        this.systemPromptGenerator.addReference(this.references);
        this.systemPromptGenerator.setModelFeature(modelFeature);
        this.systemPrompt = await this.systemPromptGenerator.renderSystemPrompt();

        logger.trace('PrepareSystemPromptFinish', {systemPrompt: this.systemPrompt});
    }

    protected async *requestModelChat(thread: MessageThread, reply: AssistantTextMessage) {
        const {logger, store} = this.context;
        const messages = thread.toMessages();

        this.pushStoreUpdate();

        logger.trace('RequestModelStart', {threadUuid: thread.uuid, messages});
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
            this.pushStoreUpdate(thread.uuid);
        }

        logger.trace('RequestModelFinish');
    }

    protected pushStoreUpdate(moveMessageToTop?: string) {
        const {logger, store} = this.context;
        logger.trace('PushStoreUpdate');
        if (moveMessageToTop) {
            store.moveThreadToTop(moveMessageToTop);
        }
        this.updateInboxThreadList(store.dump());
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
}
