import {ChatMessagePayload} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {newUuid} from '@oniichan/shared/id';
import {RequestHandler} from '../handler';

export class ModelChatHandler extends RequestHandler<ChatMessagePayload[], string> {
    static action = 'modelChat' as const;

    async *handleRequest(messages: ChatMessagePayload[]): AsyncIterable<string> {
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const telemetry = new ModelUsageTelemetry(this.getTaskId(), newUuid());
        yield* model.chatStreaming(messages, telemetry);
    }
}
