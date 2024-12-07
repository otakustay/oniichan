import {getModelConfiguration, isModelConfigurationValid} from '../utils/config';
import {notifyNotConfgured} from '../ui/notConfigured';
import {createModelClient} from '@oniichan/shared/model';

export async function createModelAccess(triggerUserConfigure = true) {
    const config = getModelConfiguration();
    console.log(config);

    if (isModelConfigurationValid(config)) {
        return createModelClient(config);
    }

    if (triggerUserConfigure) {
        await notifyNotConfgured();
        return createModelAccess(false);
    }

    const missingKeys = Object.entries(config).flatMap(([key, value]) => value ? [] : [key]);
    throw new Error(`Invalid configuration, missing ${missingKeys.join(', ')}`);
}
