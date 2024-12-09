import crypto from 'node:crypto';
import {stringifyError} from '@oniichan/shared/string';
import {createJsonlStore} from './jsonl';
import {ChatMessagePayload, ModelResponseMeta} from '@oniichan/shared/model';

export interface ModelUsageRecord {
    uuid: string;
    parentUuid: string;
    startTime: string;
    endTime: string;
    modelName: string;
    input: ChatMessagePayload[];
    output: string;
    inputTokens: number | null;
    outputTokens: number | null;
}

export class ModelUsageTelemetry {
    private readonly uuid: string;
    private readonly parentUuid: string;
    private modelName = 'unknown';
    private input: ChatMessagePayload[] = [];
    private output = '';
    private inputTokens: number | null = null;
    private outputTokens: number | null = null;
    private startTime = new Date();
    private endTime = new Date();

    constructor(uuid: string, parentUuid: string) {
        this.uuid = uuid;
        this.parentUuid = parentUuid;
    }

    setRequest(input: ChatMessagePayload[]) {
        this.input = input;
        this.startTime = new Date();
    }

    setResponse(output: string, meta: ModelResponseMeta) {
        this.output = output;
        this.modelName = meta.model;
        this.inputTokens = meta.usage.inputTokens ?? null;
        this.outputTokens = meta.usage.outputTokens ?? null;
        this.endTime = new Date();
    }

    async record() {
        const data: ModelUsageRecord = {
            uuid: this.uuid,
            parentUuid: this.parentUuid,
            modelName: this.modelName,
            input: this.input,
            output: this.output,
            startTime: this.startTime.toISOString(),
            endTime: this.endTime.toISOString(),
            inputTokens: this.inputTokens,
            outputTokens: this.outputTokens,
        };

        try {
            await using store = await createJsonlStore<ModelUsageRecord>('model-usage', {allowMockOnFail: true});
            await store.add(data);
        }
        catch (ex) {
            console.error(`Failed to record model usage: ${stringifyError(ex)}`);
        }
    }
}

export interface FunctionUsageRecord {
    uuid: string;
    startTime: string;
    endTime: string;
    function: string;
    result: 'success' | 'fail' | 'abort';
    reason: string;
    [key: string]: unknown;
}

export interface FunctionUsageSuccessResult {
    type: 'success';
}

export interface FunctionUsageAbnormalResult {
    type: 'fail' | 'abort';
    reason: string;
}

export type FunctionUsageResult = FunctionUsageSuccessResult | FunctionUsageAbnormalResult;

export class FunctionUsageTelemetry {
    private readonly uuid: string;
    private readonly function: string;
    private result: 'success' | 'fail' | 'abort' = 'abort';
    private reason = '';
    private startTime = new Date();
    private endTime = new Date();
    private readonly telemetryData = new Map<string, unknown>();

    constructor(uuid: string, functionName: string, data?: Record<string, unknown>) {
        this.uuid = uuid;
        this.function = functionName;
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                this.telemetryData.set(key, value);
            }
        }
    }

    start() {
        this.startTime = new Date();
    }

    end() {
        this.result = 'success';
        this.endTime = new Date();
    }

    fail(reason: string) {
        this.result = 'fail';
        this.reason = reason;
    }

    abort(reason: string) {
        this.result = 'abort';
        this.reason = reason;
    }

    setTelemetryData(key: string, value: unknown) {
        this.telemetryData.set(key, value);
    }

    createModelTelemetry(uuid?: string) {
        const telemetry = new ModelUsageTelemetry(uuid ?? crypto.randomUUID(), this.uuid);
        return telemetry;
    }

    async record() {
        if (this.endTime <= this.startTime) {
            this.end();
        }

        const data: FunctionUsageRecord = {
            uuid: this.uuid,
            startTime: this.startTime.toISOString(),
            endTime: this.endTime.toISOString(),
            function: this.function,
            result: this.result,
            reason: this.reason,
            ...Object.fromEntries(this.telemetryData),
        };
        try {
            await using store = await createJsonlStore<FunctionUsageRecord>('function-usage', {allowMockOnFail: true});
            await store.add(data);
        }
        catch (ex) {
            console.error(`Failed to record function usage: ${stringifyError(ex)}`);
        }
    }

    async spyRun(fn: () => Promise<FunctionUsageResult>) {
        this.start();

        try {
            const result = await fn();
            if (result.type === 'success') {
                this.end();
            }
            else {
                this[result.type](result.reason);
            }
        }
        catch (ex) {
            this.fail(stringifyError(ex));
        }
        finally {
            void this.record();
        }
    }
}
