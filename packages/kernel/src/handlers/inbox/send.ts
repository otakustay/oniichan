import {ChatMessagePayload} from '@oniichan/shared/model';
import {Message} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {now, stringifyError} from '@oniichan/shared/string';
import {newUuid} from '@oniichan/shared/id';
import {RequestHandler} from '../handler';
import {store} from './store';

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
    uuid: string;
    content: string;
}

export class InboxSendMessageHandler extends RequestHandler<InboxSendMessageRequest, InboxSendMessageResponse> {
    static action = 'inboxSendMessage' as const;

    async *handleRequest(payload: InboxSendMessageRequest): AsyncIterable<InboxSendMessageResponse> {
        const thread = store.getThreadByUuid(payload.threadUuid);
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');
        telemetry.setTelemetryData('mode', thread ? 'new' : 'reply');
        yield* telemetry.spyStreaming(() => this.chat(payload, telemetry));
    }

    private async *chat(payload: InboxSendMessageRequest, telemetry: FunctionUsageTelemetry) {
        const {editorHost} = this.context;

        // Add a user message to thread (or create a new thread)
        store.addNewMessageToThreadList(
            payload.threadUuid,
            {
                uuid: payload.uuid,
                sender: 'user',
                content: payload.body.content,
                createdAt: now(),
                status: 'read',
            }
        );
        this.updateInboxThreadList(store.dump());

        const thread = store.getThreadByUuid(payload.threadUuid);

        if (!thread) {
            // Not possible
            throw new Error(`Cannot find thread ${payload.threadUuid} after it is created`);
        }

        const toMessagePayload = (message: Message): ChatMessagePayload => {
            return {
                role: message.sender,
                content: message.content,
            };
        };
        // Messages are latest-on-top in thread
        const messages = thread.messages.map(toMessagePayload).reverse();
        const replyUuid = newUuid();
        telemetry.setTelemetryData('replyUuid', replyUuid);
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = telemetry.createModelTelemetry(this.getTaskId());
        try {
            for await (const chunk of model.chatStreaming(messages, modelTelemetry)) {
                // We update the store but don't broadcast to all views on streaming
                store.appendMessage(payload.threadUuid, replyUuid, chunk);
                yield {
                    type: 'value',
                    value: {
                        uuid: replyUuid,
                        content: chunk,
                    },
                } as const;
            }
        }
        catch (ex) {
            store.setMessageError(payload.threadUuid, replyUuid, stringifyError(ex));
        }

        // Broadcast update when message is fully generated
        store.markStatus(payload.threadUuid, replyUuid, 'unread');
        this.updateInboxThreadList(store.dump());
    }
}
