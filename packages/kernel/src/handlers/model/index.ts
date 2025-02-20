import {ChatInputPayload, ModelResponse} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {newUuid} from '@oniichan/shared/id';
import {RequestHandler} from '../handler';

export class ModelChatHandler extends RequestHandler<ChatInputPayload[], ModelResponse> {
    static readonly action = 'modelChat';

    async *handleRequest(messages: ChatInputPayload[]): AsyncIterable<ModelResponse> {
        const {modelAccess} = this.context;
        const telemetry = new ModelUsageTelemetry(this.getTaskId(), newUuid());
        yield* modelAccess.chatStreaming({messages, telemetry});
    }
}
