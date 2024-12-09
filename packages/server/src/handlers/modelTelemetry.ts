import {readModelTelemetry, ModelUsageRecord} from '@oniichan/storage/telemetry';
import {RequestHandler} from '@otakustay/ipc';

export class ModelTelemetryHandler extends RequestHandler<void, ModelUsageRecord> {
    static action = 'modelTelemetry' as const;

    async *handleRequest(): AsyncIterable<ModelUsageRecord> {
        yield* readModelTelemetry();
    }
}
