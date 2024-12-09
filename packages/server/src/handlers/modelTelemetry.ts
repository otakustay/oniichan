import {readModelTelemetry, ModelUsageRecord} from '@oniichan/storage/telemetry';
import {RequestHandler} from '@otakustay/ipc';

async function takeLastReversed<T>(iterable: AsyncIterable<T>, count: number): Promise<T[]> {
    const output: T[] = [];
    for await (const item of iterable) {
        output.unshift(item);
        if (output.length > count) {
            output.pop();
        }
    }
    return output;
}

export class ModelTelemetryHandler extends RequestHandler<void, ModelUsageRecord[]> {
    static action = 'modelTelemetry' as const;

    async *handleRequest(): AsyncIterable<ModelUsageRecord[]> {
        const result = await takeLastReversed(readModelTelemetry(), 50);
        yield result;
    }
}
