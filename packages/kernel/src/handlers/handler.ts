import {RequestHandler as BaseRequestHandler, ExecutionRequest, Port} from '@otakustay/ipc';
import {EditorHost} from '../host';
import {Logger} from '@oniichan/shared/logger';

export interface Context {
    editorHost: EditorHost;
    logger: Logger;
}

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    static functionName?: string;

    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const loggerOverride = {
            taskId: request.taskId,
            source: new.target.name,
            functionName: new.target.functionName ?? new.target.name.replace(/Handler$/, ''),
        };
        super(
            port,
            request,
            {
                editorHost: context.editorHost,
                logger: context.logger.with(loggerOverride),
            }
        );
    }
}
