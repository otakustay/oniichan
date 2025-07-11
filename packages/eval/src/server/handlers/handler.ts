import path from 'node:path';
import fs from 'node:fs/promises';
import {RequestHandler as BaseRequestHandler} from '@otakustay/ipc';
import type {ExecutionRequest, Port} from '@otakustay/ipc';
import type {Context} from '../interface.js';

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const loggerOverride = {
            source: new.target.name,
            taskId: request.taskId,
            functionName: new.target.name.replace(/Handler$/, ''),
        };
        super(
            port,
            request,
            {...context, logger: context.logger.with(loggerOverride)}
        );
    }

    protected resolveFilePath(file: string): string {
        const {cwd} = this.context;
        return path.resolve(cwd, file);
    }

    protected async readFileContent(file: string): Promise<string> {
        const absolute = this.resolveFilePath(file);
        const content = await fs.readFile(absolute, 'utf-8');
        return content;
    }
}
