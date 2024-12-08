import crypto from 'node:crypto';
import {stringifyError} from '@oniichan/shared/string';
import {createJsonlStore, JsonlStore} from './jsonl';

export interface ModelUsagePaylod {
    parentUuid: string;
    startTime: string;
    endTime: string;
    model: string;
    input: string;
    output: string;
    inputTokens: number | null;
    outputTokens: number | null;
}

interface ModelUsageRecord extends ModelUsagePaylod {
    uuid: string;
}

export async function recordModelUsageToStore(store: JsonlStore<ModelUsageRecord>, usage: ModelUsagePaylod) {
    const uuid = crypto.randomUUID();
    await store.add({uuid, ...usage});
    return uuid;
}

export async function recordModelUsage(usage: ModelUsagePaylod) {
    try {
        await using store = await createJsonlStore<ModelUsageRecord>('model-usage', {allowMockOnFail: true});
        const uuid = await recordModelUsageToStore(store, usage);
        return uuid;
    }
    catch (ex) {
        console.error(`Failed to record model usage: ${stringifyError(ex)}`);
    }
}

export interface FunctionUsagePayload {
    startTime: string;
    endTime: string;
    function: string;
    [key: string]: unknown;
}

export type ModelUsageNoParent = Omit<ModelUsagePaylod, 'parentUuid'>;

export type ModalUsageNoParentNoTime = Omit<ModelUsageNoParent, 'startTime' | 'endTime'>;

type FunctionModelUsagePayload = ModalUsageNoParentNoTime | ModelUsageNoParent[];

interface FunctionUsageRecord extends FunctionUsagePayload {
    uuid: string;
}

export async function recordFunctionUsage(usage: FunctionUsagePayload, modelUsage?: FunctionModelUsagePayload) {
    try {
        await using store = await createJsonlStore<FunctionUsageRecord>('function-usage', {allowMockOnFail: true});
        const uuid = crypto.randomUUID();
        await store.add({uuid, ...usage});

        if (modelUsage) {
            await using modelStore = await createJsonlStore<ModelUsageRecord>('model-usage', {allowMockOnFail: true});
            const modelUsages: ModelUsageNoParent[] = Array.isArray(modelUsage)
                ? modelUsage
                : [{startTime: usage.startTime, endTime: usage.endTime, ...modelUsage}];
            const record = async (modelUsage: ModelUsageNoParent) => {
                const payload: ModelUsagePaylod = {parentUuid: uuid, ...modelUsage};
                await recordModelUsageToStore(modelStore, payload);
            };
            await Promise.all(modelUsages.map(record));
        }

        return uuid;
    }
    catch (ex) {
        console.error(`Failed to record function usage: ${stringifyError(ex)}`);
    }
}
