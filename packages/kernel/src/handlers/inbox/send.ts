import deepEqual from 'fast-deep-equal';
import {over} from '@otakustay/async-iterator';
import {ChatInputPayload, ModelTextResponse, ModelToolResponse} from '@oniichan/shared/model';
import {Message, MessageReference} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {now, stringifyError} from '@oniichan/shared/string';
import {newUuid} from '@oniichan/shared/id';
import {ModelChatOptions} from '../../editor/model';
import {RequestHandler} from '../handler';
import {store} from './store';
import {ToolImplement} from './tool';

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

interface InboxSendMessageTextResponse {
    uuid: string;
    type: 'text';
    value: string;
}

interface InboxSendMessageReferenceResponse {
    uuid: string;
    type: 'reference';
    value: MessageReference;
}

export type InboxSendMessageResponse = InboxSendMessageTextResponse | InboxSendMessageReferenceResponse;

interface ToolCallState {
    current: ModelToolResponse | null;
}

interface PathArguments {
    path: string;
}

function toolCallToReference(toolCall: ModelToolResponse): MessageReference {
    switch (toolCall.name) {
        case 'readFile':
            return {
                id: toolCall.id,
                type: 'file',
                path: (toolCall.arguments as PathArguments).path,
            };
        case 'readDirectory':
            return {
                id: toolCall.id,
                type: 'directory',
                path: (toolCall.arguments as PathArguments).path,
            };
        default:
            throw new Error(`Unknown tool call ${toolCall.name}`);
    }
}

function threadMessageToInputPayload(message: Message): ChatInputPayload {
    return {
        role: message.sender,
        content: message.content,
    };
}

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static action = 'inboxSendMessage' as const;

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    private readonly messages: ChatInputPayload[] = [];

    private threadUuid = '';

    private replyUuid = newUuid();

    private enableTool = true;

    private readonly toolCallLimit = 10;

    private tool: ToolImplement | null = null;

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger, editorHost} = this.context;
        logger.info('Start', payload);

        this.tool = new ToolImplement(editorHost);
        this.threadUuid = payload.threadUuid;
        const thread = store.getThreadByUuid(payload.threadUuid);
        if (thread) {
            // Messages are latest-on-top in thread
            this.messages.unshift(...thread.messages.map(threadMessageToInputPayload));
        }
        this.telemetry.setTelemetryData('mode', thread ? 'new' : 'reply');

        try {
            yield* this.telemetry.spyStreaming(() => this.chat(payload));
            logger.info('Finish');
        }
        catch (ex) {
            logger.error('Fail', {reason: stringifyError(ex)});
        }
    }

    private persistToolChunk(chunk: ModelToolResponse): InboxSendMessageResponse {
        const {logger} = this.context;
        const reference = toolCallToReference(chunk);
        logger.trace(
            'AddReference',
            {threadUuid: this.threadUuid, messageUuid: this.replyUuid, reference: chunk}
        );
        // Broadcast tool usage
        store.addReference(this.threadUuid, this.replyUuid, reference);
        this.updateInboxThreadList(store.dump());
        return {uuid: this.replyUuid, type: 'reference', value: reference};
    }

    private persistTextChunk(chunk: ModelTextResponse): InboxSendMessageResponse {
        const {logger} = this.context;
        logger.trace(
            'AppendMessage',
            {threadUuid: this.threadUuid, messageUuid: this.replyUuid, chunk: chunk}
        );
        // We update the store but don't broadcast to all views on streaming
        store.appendMessage(this.threadUuid, this.replyUuid, chunk.content);
        return {uuid: this.replyUuid, type: 'text', value: chunk.content};
    }

    private hasSameToolCall(toolCall: ModelToolResponse): boolean {
        const isSame = (message: ChatInputPayload) => {
            if (message.role !== 'assistant') {
                return false;
            }
            if (!message.toolCall) {
                return false;
            }

            return message.toolCall.functionName === toolCall.name
                && deepEqual(message.toolCall.arguments, toolCall.arguments);
        };
        return this.messages.some(isSame);
    }

    private reachesToolCallLimit(): boolean {
        const calls = this.messages.filter(message => message.role === 'assistant').filter(v => !!v.toolCall);

        return calls.length >= this.toolCallLimit;
    }

    private async *handleToolCall(toolCall: ModelToolResponse): AsyncIterable<InboxSendMessageResponse> {
        const {logger} = this.context;

        // Stop if the same tool is called with the same arguments, this is possibily a bug behavior of LLM.
        if (this.hasSameToolCall(toolCall)) {
            logger.info('ToolCallDuplicated', toolCall);
            this.enableTool = false;
            yield* this.requestModel();
            return;
        }

        if (this.reachesToolCallLimit()) {
            logger.info('ToolCallLimitReached', toolCall);
            this.enableTool = false;
            yield* this.requestModel();
            return;
        }

        logger.trace('HandleToolCallStart', toolCall);
        const implement = new ToolImplement(this.context.editorHost);
        const result = await implement.callTool(toolCall.name, toolCall.arguments);
        logger.trace('HandleToolCallFinish', {...toolCall, result});
        this.messages.push(
            {
                role: 'assistant',
                content: '',
                toolCall: {
                    id: toolCall.id,
                    functionName: toolCall.name,
                    arguments: toolCall.arguments,
                },
            },
            {
                role: 'tool',
                callId: toolCall.id,
                content: result,
            }
        );
        yield* this.requestModel();
    }

    private async *requestModel(): AsyncIterable<InboxSendMessageResponse> {
        const {logger} = this.context;
        logger.trace('RequestModelStart', {threadUuid: this.threadUuid, messages: this.messages});
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = this.telemetry.createModelTelemetry(this.getTaskId());
        const tool: ToolCallState = {current: null};
        const options: ModelChatOptions = {
            tools: this.enableTool ? (this.tool?.getBuiltinTools() ?? []) : [],
            messages: this.messages,
            telemetry: modelTelemetry,
        };
        for await (const chunk of model.chatStreaming(options)) {
            logger.trace('RequestModelChunk', chunk);
            if (chunk.type === 'tool') {
                tool.current = chunk;
                // Don't add reference of duplicated tool call to store, this will be handled in `handleToolCall` later
                if (!this.hasSameToolCall(chunk)) {
                    yield this.persistToolChunk(chunk);
                }
            }
            else {
                yield this.persistTextChunk(chunk);
            }
        }
        logger.trace('RequestModelFinish');

        if (tool.current) {
            yield* this.handleToolCall(tool.current);
        }
    }

    private async *chat(payload: InboxSendMessageRequest) {
        const {logger} = this.context;
        logger.trace('AddNewMessageToStore', payload);
        this.messages.push({role: 'user', content: payload.body.content});
        // Add a user message to thread (or create a new thread)
        store.addNewMessageToThreadList(
            this.threadUuid,
            {
                uuid: payload.uuid,
                sender: 'user',
                content: payload.body.content,
                createdAt: now(),
                references: [],
                status: 'read',
            }
        );
        logger.trace('PushStoreUpdate');
        this.updateInboxThreadList(store.dump());

        try {
            yield* over(this.requestModel()).map(v => ({type: 'value', value: v} as const));
        }
        catch (ex) {
            store.setMessageError(this.threadUuid, this.replyUuid, stringifyError(ex));
            throw ex;
        }
        finally {
            // Broadcast update when message is fully generated
            logger.trace('MarkMessageUnread', {threadUuid: this.threadUuid, messageUuid: this.replyUuid});
            store.markStatus(this.threadUuid, this.replyUuid, 'unread');
            logger.trace('PushStoreUpdate');
            this.updateInboxThreadList(store.dump());
        }
    }
}
