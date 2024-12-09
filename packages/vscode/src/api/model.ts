import {getModelConfiguration, isModelConfigurationValid} from '../utils/config';
import {notifyNotConfgured} from '../ui/notConfigured';
import {ChatMessagePayload, createModelClient} from '@oniichan/shared/model';
import {ModelUsageTelemetry} from '@oniichan/storage/telemetry';

export interface ModelAccess {
    chat: (messages: ChatMessagePayload[], telemetry: ModelUsageTelemetry) => Promise<string>;
}

export async function createModelAccess(triggerUserConfigure = true): Promise<ModelAccess> {
    const config = getModelConfiguration();
    if (isModelConfigurationValid(config)) {
        const client = createModelClient(config);
        return {
            chat: async (messages, telemetry) => {
                telemetry.setRequest(messages);
                const [response, meta] = await client.chat(messages);
                telemetry.setResponse(response, meta);
                void telemetry.record();
                return response;
            },
        };
    }

    if (triggerUserConfigure) {
        await notifyNotConfgured();
        return createModelAccess(false);
    }

    const missingKeys = Object.entries(config).flatMap(([key, value]) => value ? [] : [key]);
    throw new Error(`Invalid configuration, missing ${missingKeys.join(', ')}`);
}
