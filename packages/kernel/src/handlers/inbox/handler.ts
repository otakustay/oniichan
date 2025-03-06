import {InboxConfig} from '@oniichan/editor-host/protocol';
import {InboxPromptMode, InboxPromptReference} from '@oniichan/prompt';
import {ModelResponse} from '@oniichan/shared/model';
import {MessageInputChunk, ReasoningMessageChunk} from '@oniichan/shared/inbox';
import {StreamingToolParser} from '@oniichan/shared/tool';
import {duplicate, merge} from '@oniichan/shared/iterable';
import {over} from '@otakustay/async-iterator';
import {stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {ModelAccessHost, ModelChatOptions} from '../../core/model';
import {createEmptyMessageThread, createEmptyRoundtrip, InboxRoundtrip, isToolCallMessageOf} from '../../inbox';
import {WorkflowDetector, WorkflowRunner, WorkflowStepInit} from '../../workflow';
import {InboxMessageThread} from '../../inbox';
import {RequestHandler} from '../handler';
import {SystemPromptGenerator} from './prompt';

function isChunkAbleToFlushImmediately(chunk: MessageInputChunk) {
    // For every type that "can stream very freauently", we don't flush them immediately
    return chunk.type !== 'text'
        && chunk.type !== 'contentDelta'
        && chunk.type !== 'planTaskDelta'
        && chunk.type !== 'toolDelta'
        && chunk.type !== 'reasoning'
        && chunk.type !== 'textInPlan'
        && chunk.type !== 'textInTool';
}

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
    protected thread: InboxMessageThread = createEmptyMessageThread();

    protected roundtrip: InboxRoundtrip = createEmptyRoundtrip();

    private readonly systemPromptGenerator = new SystemPromptGenerator(this.context.editorHost, this.context.logger);

    private readonly references: InboxPromptReference[] = [];

    private inboxConfig: InboxConfig = {
        enableDeepThink: false,
        automaticRunCommand: false,
        exceptionCommandList: [],
        ringRingMode: {
            enabled: false,
            plannerModel: '',
            actorModel: '',
            coderModel: '',
        },
    };

    private modelAccess = new ModelAccessHost(this.context.editorHost, {enableDeepThink: false});

    private systemPrompt = '';

    private workingMode: InboxPromptMode = 'standalone';

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

    protected async *requestModelChat(): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        await this.prepareChatContext();
        const options = this.getModelOptions();

        const reply = this.roundtrip.startTextResponse(newUuid());
        this.pushStoreUpdate();

        logger.trace('RequestModelStart', {threadUuid: this.thread.uuid, messages: options.messages});
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

                if (isChunkAbleToFlushImmediately(chunk)) {
                    this.pushStoreUpdate();
                }

                // Force at most one tool is used per response
                if (chunk.type === 'toolEnd') {
                    state.toolCallOccured = true;
                }
            }

            if (!reply.getTextContent().trim()) {
                reply.setError('Model replies empty content');
            }
        }
        catch (ex) {
            reply.setError(stringifyError(ex));
        }
        finally {
            // Broadcast update when one message is fully generated
            this.pushStoreUpdate(this.thread.uuid);
        }

        logger.trace('RequestModelFinish');

        const workflowRunner = await this.detectWorkflowRunner();

        if (workflowRunner) {
            yield* this.runWorkflow(workflowRunner);
        }
    }

    protected async detectWorkflowRunner() {
        const {logger, editorHost, commandExecutor} = this.context;
        const detectorInit: WorkflowStepInit = {
            thread: this.thread,
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
        const workflowRunner = detector.detectWorkflow();
        return workflowRunner;
    }

    protected async *runWorkflow(runner: WorkflowRunner): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        const reply = this.getReplyMessage();
        try {
            logger.trace('RunWorkflow', {threadUuid: this.thread.uuid, originUuid: reply.uuid});
            await runner.run();
            logger.trace('RunWorkflowFinish');
        }
        catch (ex) {
            const reason = stringifyError(ex);
            logger.error('RunWorkflowFail', {threadUuid: this.thread.uuid, originUuid: reply.uuid, reason});
            reply.setError(reason);
        }
        finally {
            this.pushStoreUpdate(this.thread.uuid);
        }

        const workflow = this.roundtrip.getLatestWorkflowStrict();
        if (workflow.shouldContinueRoundtrip()) {
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

    private async prepareChatContext() {
        const {logger} = this.context;
        logger.trace('PrepareSystemPromptStart');

        this.prepareWorkingMode();
        this.systemPromptGenerator.setMode(this.workingMode);
        const modelFeature = await this.modelAccess.getModelFeature();
        this.systemPromptGenerator.addReference(this.references);
        this.systemPromptGenerator.setModelFeature(modelFeature);
        this.systemPrompt = await this.systemPromptGenerator.renderSystemPrompt();

        logger.trace('PrepareSystemPromptFinish', {systemPrompt: this.systemPrompt});
    }

    private getModelOptions(): ModelChatOptions {
        // TODO: Keep less messages in act mode
        const messages = this.thread.toMessages();
        const modelTelemetry = this.telemetry.createModelTelemetry();
        const options: ModelChatOptions = {
            messages: messages.map(v => v.toChatInputPayload()),
            telemetry: modelTelemetry,
            systemPrompt: this.systemPrompt,
        };

        if (this.workingMode !== 'standalone') {
            // TODO: Use coder model
            options.overrideModelName = this.workingMode === 'plan'
                ? this.inboxConfig.ringRingMode.plannerModel
                : this.inboxConfig.ringRingMode.actorModel;
        }

        return options;
    }

    private getReplyMessage() {
        return this.roundtrip.getLatestTextMessage() ?? this.roundtrip.getLatestWorkflowStrict().getOriginMessage();
    }

    // TODO: Move ring ring mode logic to `send` handler
    private prepareWorkingMode() {
        const {logger} = this.context;

        if (!this.inboxConfig.ringRingMode.enabled) {
            this.workingMode = 'standalone';
            return;
        }

        const mode = this.getRingRingWorkingMode();
        this.workingMode = mode ?? 'standalone';

        if (!mode) {
            logger.warn('UnexpectedWorkingMode', {mode: 'standalone'});
        }
    }

    private getRingRingWorkingMode(): InboxPromptMode | null {
        const messages = this.thread.toMessages();

        // Only user request message, the first reply should be in plan mode
        if (messages.length <= 1) {
            return 'plan';
        }

        const reply = this.getReplyMessage();
        if (isToolCallMessageOf(reply, 'complete_task')) {
            const chunk = reply.findToolCallChunkStrict();
            const progress = chunk.toolName === 'complete_task' ? chunk.executionData : null;
            // Is a `complete_task` indicates all tasks are finished, back to plan mode
            return (progress && progress.completedTasks === progress.totalTasks) ? 'plan' : 'act';
        }

        // Go act mode if plan exists in previous messages
        if (messages.some(v => v.type === 'plan')) {
            return 'act';
        }

        return null;
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
