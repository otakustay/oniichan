import type {ChatInputPayload, ModelResponse} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';
import {newUuid} from '@oniichan/shared/id';
import {ModelAccessHost} from '../../core/model/index.js';
import {RequestHandler} from '../handler.js';

export class ModelChatHandler extends RequestHandler<ChatInputPayload[], ModelResponse> {
    static readonly action = 'modelChat';

    async *handleRequest(messages: ChatInputPayload[]): AsyncIterable<ModelResponse> {
        const {editorHost} = this.context;
        const modelAccess = new ModelAccessHost(editorHost);
        const telemetry = new ModelUsageTelemetry(this.getTaskId(), newUuid());
        yield* modelAccess.chatStreaming({messages, telemetry});
    }
}
