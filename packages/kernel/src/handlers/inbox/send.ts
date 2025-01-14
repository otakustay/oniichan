import deepEqual from 'fast-deep-equal';
import {over} from '@otakustay/async-iterator';
import {ChatInputPayload, ModelTextResponse, ModelToolResponse} from '@oniichan/shared/model';
import {Message} from '@oniichan/shared/inbox';
import {MessageToolUsage} from '@oniichan/shared/tool';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {now} from '@oniichan/shared/string';
import {stringifyError} from '@oniichan/shared/error';
import {isToolName} from '@oniichan/shared/tool';
import {renderPrompt} from '@oniichan/shared/prompt';
import {newUuid} from '@oniichan/shared/id';
import {ModelChatOptions} from '../../editor/model';
import {RequestHandler} from '../handler';
import systemPromptTemplate from './system.prompt';
import {store} from './store';
import {ToolCallInput, ToolImplement} from './tool';

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

interface InboxSendMessageUsageResponse {
    uuid: string;
    type: 'toolUsage';
    value: MessageToolUsage;
}

export type InboxSendMessageResponse = InboxSendMessageTextResponse | InboxSendMessageUsageResponse;

interface ToolCallState {
    current: ModelToolResponse | null;
}

function toolCallToUsage(toolCall: ModelToolResponse): MessageToolUsage {
    if (isToolName(toolCall.name)) {
        return {
            id: toolCall.id,
            type: toolCall.name,
            args: toolCall.arguments as any,
        };
    }

    throw new Error(`Unknown tool call ${toolCall.name}`);
}

function threadMessageToInputPayload(message: Message): ChatInputPayload {
    if (message.sender === 'user') {
        return {role: 'user', content: message.content};
    }

    // We discard all tool calls on the initial transform of thread message,
    // I don't know if this is OK but I can't handle the inconsistant between message history and current file content
    return {
        role: 'assistant',
        content: message.content.filter(v => typeof v === 'string').join(''),
    };
}

/**
 * Roundtrip is designed to check unexpected LLM behaviors in a single user request.
 *
 * Each roundtrip consists of several messages, in different cases:
 *
 * 1. All history messages are grouped into one roundtrip
 * 2. For every new user message, it is grouped with all its following assistant messages and tool calls
 */
interface ChatRoundtrip {
    messages: ChatInputPayload[];
}

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static readonly action = 'inboxSendMessage';

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    private readonly roundtrips: ChatRoundtrip[] = [];

    private threadUuid = '';

    private replyUuid = newUuid();

    private enableTool = true;

    private readonly toolCallLimit = Infinity;

    private tool: ToolImplement | null = null;

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const {logger, editorHost} = this.context;
        logger.info('Start', payload);

        this.tool = new ToolImplement(editorHost);
        this.threadUuid = payload.threadUuid;
        const thread = store.getThreadByUuid(payload.threadUuid);
        if (thread) {
            const historyRoundtrip: ChatRoundtrip = {
                // Messages are latest-on-top in thread
                messages: thread.messages.map(threadMessageToInputPayload).reverse(),
            };
            this.roundtrips.push(historyRoundtrip);
        }

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
        const reference = toolCallToUsage(chunk);
        logger.trace(
            'AddReference',
            {threadUuid: this.threadUuid, messageUuid: this.replyUuid, reference: chunk}
        );

        if (!chunk.hasThought && chunk.reason) {
            this.persistTextChunk({type: 'text', content: chunk.reason});
        }

        // Broadcast tool usage
        store.addToolUsage(this.threadUuid, this.replyUuid, reference);
        store.moveThreadToTop(this.threadUuid);
        this.updateInboxThreadList(store.dump());
        return {uuid: this.replyUuid, type: 'toolUsage', value: reference};
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
        const roundtrip = this.getCurrentRoundtrip();

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
        return roundtrip.messages.some(isSame);
    }

    private reachesToolCallLimit(): boolean {
        const roundtrip = this.getCurrentRoundtrip();
        const calls = roundtrip.messages.filter(message => message.role === 'assistant').filter(v => !!v.toolCall);

        return calls.length >= this.toolCallLimit;
    }

    private async *handleToolCall(toolCall: ModelToolResponse): AsyncIterable<InboxSendMessageResponse> {
        const {logger} = this.context;

        // Stop if the same tool is called with the same arguments, this is possibily a bug behavior of LLM
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
        const result = await implement.callTool(toolCall as ToolCallInput);
        logger.trace('HandleToolCallFinish', {...toolCall, result});
        const roundtrip = this.getCurrentRoundtrip();
        roundtrip.messages.push(
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
        const systemPrompt = renderPrompt(systemPromptTemplate, {});
        logger.trace('RequestModelStart', {threadUuid: this.threadUuid, roundtrips: this.roundtrips, systemPrompt});
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = this.telemetry.createModelTelemetry(this.getTaskId());
        const tool: ToolCallState = {current: null};
        const options: ModelChatOptions = {
            tools: this.enableTool ? (this.tool?.getBuiltinTools() ?? []) : [],
            messages: this.roundtrips.flatMap(v => v.messages),
            telemetry: modelTelemetry,
            systemPrompt,
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
        const roundtrip: ChatRoundtrip = {
            messages: [{role: 'user', content: payload.body.content}],
        };
        this.roundtrips.push(roundtrip);
        // Add a user message to thread (or create a new thread)
        store.addNewMessageToThreadList(
            this.threadUuid,
            {
                uuid: payload.uuid,
                sender: 'user',
                content: payload.body.content,
                createdAt: now(),
                status: 'read',
            }
        );
        logger.trace('PushStoreUpdate');
        store.moveThreadToTop(this.threadUuid);
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
            store.moveThreadToTop(this.threadUuid);
            this.updateInboxThreadList(store.dump());
        }
    }

    private getCurrentRoundtrip() {
        const roundtrip = this.roundtrips.at(-1);

        if (!roundtrip) {
            throw new Error('Unexpected chat state with no roundtrip');
        }

        return roundtrip;
    }
}
