import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {globalConfigDirectory} from '@oniichan/shared/dir';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {RequestHandler} from '../handler';

export class EjectInternalsHandler extends RequestHandler<void, string> {
    static readonly action = 'debugEjectInternals';

    async *handleRequest(): AsyncIterable<string> {
        const {logger} = this.context;
        logger.info('Start');

        const directory = await globalConfigDirectory();
        const telemetry = new FunctionUsageTelemetry(this.getTaskId(), 'debugExportInbox');

        if (!directory) {
            logger.error('NoDirectory');
            telemetry.fail('NoDirectory');
            throw new Error('Unable to create global config directory');
        }

        const configFile = path.join(directory, 'config.json');
        if (!existsSync(configFile)) {
            await fs.writeFile(configFile, JSON.stringify({embeddingOnQuery: true, embeddingAsTool: false}, null, 2));
        }
        yield configFile;
        logger.trace('WriteConfig', {file: configFile});
        telemetry.setTelemetryData('configFile', configFile);

        telemetry.end();
    }
}
