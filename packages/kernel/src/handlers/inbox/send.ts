import {ChatInputPayload, ModelToolResponse} from '@oniichan/shared/model';
import {Message, MessageReference} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {now, stringifyError} from '@oniichan/shared/string';
import {newUuid} from '@oniichan/shared/id';
import {RequestHandler} from '../handler';
import {store} from './store';
import {tools, ToolImplement} from './tool';

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

interface RequestOptions {
    messages: ChatInputPayload[];
    replyUuid: string;
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

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static action = 'inboxSendMessage' as const;

    private telemetry: FunctionUsageTelemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const thread = store.getThreadByUuid(payload.threadUuid);
        this.telemetry.setTelemetryData('mode', thread ? 'new' : 'reply');
        yield* this.telemetry.spyStreaming(() => this.chat(payload));
    }

    private async *requestModel(options: RequestOptions): AsyncIterable<InboxSendMessageResponse> {
        const {messages, replyUuid} = options;
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = this.telemetry.createModelTelemetry(this.getTaskId());
        const tool: ToolCallState = {
            current: null,
        };
        for await (const chunk of model.chatStreaming({tools, messages, telemetry: modelTelemetry})) {
            if (chunk.type === 'tool') {
                tool.current = chunk;
                yield {uuid: replyUuid, type: 'reference', value: toolCallToReference(chunk)};
            }
            else {
                yield {uuid: replyUuid, type: 'text', value: chunk.content};
            }
        }

        if (tool.current) {
            const implement = new ToolImplement(this.context.editorHost);
            const result = await implement.callTool(tool.current.name, tool.current.arguments);
            const nextMessages: ChatInputPayload[] = [
                ...messages,
                {
                    role: 'assistant',
                    content: '',
                    toolCall: {
                        id: tool.current.id,
                        functionName: tool.current.name,
                        arguments: tool.current.arguments,
                    },
                },
                {
                    role: 'tool',
                    callId: tool.current.id,
                    content: result,
                },
            ];
            yield* this.requestModel({messages: nextMessages, replyUuid});
        }
    }

    private async *chat(payload: InboxSendMessageRequest) {
        // Add a user message to thread (or create a new thread)
        store.addNewMessageToThreadList(
            payload.threadUuid,
            {
                uuid: payload.uuid,
                sender: 'user',
                content: payload.body.content,
                createdAt: now(),
                references: [],
                status: 'read',
            }
        );
        this.updateInboxThreadList(store.dump());

        const thread = store.getThreadByUuid(payload.threadUuid);

        if (!thread) {
            // Not possible
            throw new Error(`Cannot find thread ${payload.threadUuid} after it is created`);
        }

        const toMessagePayload = (message: Message): ChatInputPayload => {
            return {
                role: message.sender,
                content: message.content,
            };
        };
        // Messages are latest-on-top in thread
        const messages = thread.messages.map(toMessagePayload).reverse();
        const replyUuid = newUuid();
        try {
            for await (const chunk of this.requestModel({messages, replyUuid})) {
                if (chunk.type === 'text') {
                    // We update the store but don't broadcast to all views on streaming
                    store.appendMessage(payload.threadUuid, replyUuid, chunk.value);
                }
                else {
                    // Broadcast tool usage
                    store.addReference(payload.threadUuid, replyUuid, chunk.value);
                    this.updateInboxThreadList(store.dump());
                }

                yield {type: 'value', value: chunk} as const;
            }
        }
        catch (ex) {
            console.error(ex);
            store.setMessageError(payload.threadUuid, replyUuid, stringifyError(ex));
        }

        // Broadcast update when message is fully generated
        store.markStatus(payload.threadUuid, replyUuid, 'unread');
        this.updateInboxThreadList(store.dump());
    }
}
