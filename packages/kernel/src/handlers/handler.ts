import {RequestHandler as BaseRequestHandler, ExecutionRequest, Port} from '@otakustay/ipc';
import {LogEntry, Logger, LoggerScope} from '@oniichan/shared/logger';
import {EditorHost} from '../host';

type SendNotice = (action: string, payload?: any) => void;

class HandlerLogger extends Logger {
    private readonly sendNotice: SendNotice;

    constructor(sendNotice: SendNotice, source?: string, taskId?: string, functionName?: string) {
        super(source, taskId, functionName);
        this.sendNotice = sendNotice;
    }

    print(entry: LogEntry): void {
        this.sendNotice('log', entry);
    }

    with(override: LoggerScope): Logger {
        return new HandlerLogger(
            this.sendNotice,
            override.source ?? this.source,
            override.taskId ?? this.taskId,
            override.functionName ?? this.functionName
        );
    }
}

export interface Context {
    editorHost: EditorHost;
    logger: Logger;
}

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    static functionName?: string;

    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const {source, functionName} = context.logger.toScope();
        const sendNotice: SendNotice = (action: string, payload?: any) => this.notify(action, payload);
        super(
            port,
            request,
            {
                editorHost: context.editorHost,
                logger: new HandlerLogger(sendNotice, source, request.taskId, functionName),
            }
        );
    }
}
