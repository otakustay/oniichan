import {RequestHandler as BaseRequestHandler} from '@otakustay/ipc';
import type {ExecutionRequest, Port} from '@otakustay/ipc';
import {Logger} from '@oniichan/shared/logger';
import type {LogEntry, LoggerScope} from '@oniichan/shared/logger';
import type {MessageThreadData} from '@oniichan/shared/inbox';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {CommandExecutor} from '../core/command';
import type {EditorHost} from '../core/editor';
import {ThreadStore} from '../inbox';

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
    commandExecutor: CommandExecutor;
    store: ThreadStore;
    logger: Logger;
}

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    static functionName?: string;

    protected telemetry: FunctionUsageTelemetry;

    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const sendNotice: SendNotice = (action: string, payload?: any) => this.notify(action, payload);
        const functionName = new.target.functionName ?? new.target.name.replace(/Handler$/, '');
        super(
            port,
            request,
            {
                editorHost: context.editorHost,
                commandExecutor: context.commandExecutor,
                store: context.store,
                logger: new HandlerLogger(
                    sendNotice,
                    new.target.name,
                    request.taskId,
                    functionName
                ),
            }
        );
        this.telemetry = new FunctionUsageTelemetry(this.getTaskId(), functionName);
    }

    updateInboxThreadList(threads: MessageThreadData[]): void {
        this.notify('updateInboxThreadList', threads);
    }
}
