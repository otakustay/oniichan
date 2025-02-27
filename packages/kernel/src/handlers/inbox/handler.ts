import {InboxConfig} from '@oniichan/editor-host/protocol';
import {InboxPromptReference} from '@oniichan/prompt';
import {ModelResponse} from '@oniichan/shared/model';
import {MessageInputChunk, ReasoningMessageChunk} from '@oniichan/shared/inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {duplicate, merge} from '@oniichan/shared/iterable';
import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {InboxRoundtrip, MessageThread, Roundtrip} from '../../inbox';
import {WorkflowDetector, WorkflowDetectorInit, WorkflowRunner} from '../../workflow';
import {RequestHandler} from '../handler';
import {SystemPromptGenerator} from './prompt';

export interface InboxMessageIdentity {
    threadUuid: string;
    messageUuid: string;
}

export interface InboxRoundtripIdentity {
    threadUuid: string;
    requestMessageUuid: string;
}

export interface InboxMessageResponse {
    replyUuid: string;
    value: MessageInputChunk;
}

export abstract class InboxRequestHandler<I, O> extends RequestHandler<I, O> {
    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost, this.context.logger);

    private readonly references: InboxPromptReference[] = [];

    protected inboxConfig: InboxConfig = {enableDeepThink: false, automaticRunCommand: false, exceptionCommandList: []};

    protected thread: MessageThread = new MessageThread(newUuid());

    protected roundtrip: InboxRoundtrip = new Roundtrip();

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

    protected async *requestModelChat(): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        const reply = this.roundtrip.startTextResponse(newUuid());
        const messages = this.thread.toMessages();

        this.pushStoreUpdate();

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
                    this.pushStoreUpdate();
                }

                // Force at most one tool is used per response
                if (chunk.type === 'toolEnd') {
                    state.toolCallOccured = true;
                }
            }
        }
        catch (ex) {
            reply.setError(stringifyError(ex));
        }
        finally {
            // Broadcast update when one message is fully generated
            this.pushStoreUpdate(this.thread.uuid);
        }

        // TODO: Add a special error if message is empty after request complete

        logger.trace('RequestModelFinish');

        const workflowRunner = await this.detectWorkflowRunner();

        if (workflowRunner) {
            yield* this.runWorkflow(workflowRunner, 'run');
        }
    }

    protected async detectWorkflowRunner() {
        const {logger, editorHost, commandExecutor} = this.context;
        const detectorInit: WorkflowDetectorInit = {
            threadUuid: this.thread.uuid,
            taskId: this.getTaskId(),
            systemPrompt: this.systemPrompt,
            telemetry: this.telemetry,
            modelAccess: this.modelAccess,
            roundtrip: this.roundtrip,
            inboxConfig: this.inboxConfig,
            editorHost,
            commandExecutor,
            logger,
            onUpdateThread: () => this.pushStoreUpdate(),
        };
        const detector = new WorkflowDetector(detectorInit);
        const workflowRunner = await detector.detectWorkflow();

        if (workflowRunner) {
            // Detecting workflow can change message content, such as move a text message to tool call message
            this.pushStoreUpdate();
        }

        return workflowRunner;
    }

    protected async *runWorkflow(runner: WorkflowRunner, mode: 'run' | 'reject'): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        const origin = runner.getWorkflow().getOriginMessage();
        try {
            logger.trace('RunWorkflow', {originUuid: origin.uuid});
            await runner[mode]();
            logger.trace('RunWorkflowFinish');
        }
        catch (ex) {
            const reason = stringifyError(ex);
            logger.error('RunWorkflowFail', {reason});
            origin.setError(reason);
        }
        finally {
            this.pushStoreUpdate(this.thread.uuid);
        }

        if (runner.getWorkflow().shouldContinueRoundtrip()) {
            yield* this.requestModelChat();
        }
    }

    protected pushStoreUpdate(moveThreadToTop?: string) {
        const {logger, store} = this.context;
        logger.trace('PushStoreUpdate');
        if (moveThreadToTop) {
            store.moveThreadToTop(moveThreadToTop);
        }
        this.updateInboxThreadList(store.dump());
    }

    private consumeChatStream(chatStream: AsyncIterable<ModelResponse>): AsyncIterable<MessageInputChunk> {
        const parser = new StreamingToolParser();
        const [reasoningFork, textFork] = duplicate(chatStream);
        const reasoningStream = over(reasoningFork)
            .filter(v => v.type === 'reasoning')
            .map((v: ModelResponse): ReasoningMessageChunk => ({type: 'reasoning', content: v.content}));
        const textStream = over(textFork).filter(v => v.type === 'text').map(v => v.content);
        return merge(reasoningStream, parser.parse(textStream));
    }
}
