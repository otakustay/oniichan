import {ChatMessagePayload} from '@oniichan/shared/model';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';

export class InboxSendMessageHandler extends RequestHandler<ChatMessagePayload[], string> {
    static action = 'inboxSendMessage' as const;

    async *handleRequest(messages: ChatMessagePayload[]): AsyncIterable<string> {
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'inboxSendMessage');
        telemetry.setTelemetryData('mode', messages.length === 1 ? 'new' : 'reply');
        yield* telemetry.spyStreaming(() => this.chat(messages, telemetry));
    }

    private async *chat(messages: ChatMessagePayload[], telemetry: FunctionUsageTelemetry) {
        const {editorHost} = this.context;
        const model = editorHost.getModelAccess(this.getTaskId());
        const modelTelemetry = telemetry.createModelTelemetry(this.getTaskId());
        for await (const chunk of model.chatStreaming(messages, modelTelemetry)) {
            yield {type: 'value', value: chunk} as const;
        }
    }
}
