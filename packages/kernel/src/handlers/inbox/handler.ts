import type {InboxConfig} from '@oniichan/editor-host/protocol';
import type {InboxPromptReference} from '@oniichan/prompt';
import type {MessageInputChunk} from '@oniichan/shared/inbox';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {newUuid} from '@oniichan/shared/id';
import {ModelAccessHost} from '../../core/model';
import {createEmptyMessageThread, createEmptyRoundtrip} from '../../inbox';
import type {InboxRoundtrip} from '../../inbox';
import {WorkflowDetector} from '../../workflow';
import type {WorkflowStepInit, WorkflowRunner} from '../../workflow';
import type {InboxMessageThread} from '../../inbox';
import {RequestHandler} from '../handler';
import {CoupleChatCapabilityProvider, RingRingChatCapabilityProvider, StandaloneChatCapabilityProvider} from './mode';
import type {ChatCapabilityProvider, ChatCapabilityProviderInit} from './mode';

function isChunkAbleToFlushImmediately(chunk: MessageInputChunk) {
    // For every type that "will stream very freauently", we don't flush them immediately
    return chunk.type !== 'text'
        && chunk.type !== 'contentDelta'
        && chunk.type !== 'toolDelta'
        && chunk.type !== 'reasoning'
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

    private readonly references: InboxPromptReference[] = [];

    private inboxConfig: InboxConfig = {
        automaticRunCommand: false,
        exceptionCommandList: [],
        plannerModel: '',
        actorModel: '',
        coderModel: null,
    };

    private modelAccess = new ModelAccessHost(this.context.editorHost);

    protected addReference(references: InboxPromptReference[]) {
        this.references.push(...references);
    }

    protected async prepareEnvironment() {
        const {editorHost, logger} = this.context;

        logger.trace('PrepareInboxConfig');
        this.inboxConfig = await editorHost.call('getInboxConfig');

        logger.trace('PrepareModelAccess');
        this.modelAccess = new ModelAccessHost(editorHost);
    }

    protected async *requestModelChat(): AsyncIterable<InboxMessageResponse> {
        const {logger} = this.context;
        const provider = this.createContextProvider();
        const role = await provider.provideAssistantRole();

        const reply = this.roundtrip.startTextResponse(newUuid(), role);
        this.pushStoreUpdate();

        logger.trace('RequestModelStart', {threadUuid: this.thread.uuid, replyMessageUuid: reply.uuid});

        try {
            for await (const chunk of provider.provideChatStream()) {
                // We update the store but don't broadcast to all views on streaming
                reply.addChunk(chunk);
                yield {replyUuid: reply.uuid, value: chunk};

                if (isChunkAbleToFlushImmediately(chunk)) {
                    this.pushStoreUpdate();
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

    private getReplyMessage() {
        return this.roundtrip.getLatestTextMessage() ?? this.roundtrip.getLatestWorkflowStrict().getOriginMessage();
    }

    private createContextProvider(): ChatCapabilityProvider {
        const providerInit: ChatCapabilityProviderInit = {
            logger: this.context.logger,
            editorHost: this.context.editorHost,
            references: this.references,
            modelAccess: this.modelAccess,
            thread: this.thread,
            roundtrip: this.roundtrip,
            config: this.inboxConfig,
            telemetry: this.telemetry,
        };
        const workingMode = this.thread.getWorkingMode();
        switch (workingMode) {
            case 'normal':
                return new StandaloneChatCapabilityProvider(providerInit);
            case 'ringRing':
                return new RingRingChatCapabilityProvider(providerInit);
            case 'couple':
                return new CoupleChatCapabilityProvider(providerInit);
            default:
                assertNever<string>(workingMode, v => `Unknown working mode ${v}`);
        }
    }
}
