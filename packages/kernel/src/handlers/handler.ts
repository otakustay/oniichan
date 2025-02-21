import {RequestHandler as BaseRequestHandler, ExecutionRequest, Port, TaskIdBoundClient} from '@otakustay/ipc';
import {LogEntry, Logger, LoggerScope} from '@oniichan/shared/logger';
import {MessageThreadData} from '@oniichan/shared/inbox';
import {EditorHostProtocol} from '@oniichan/editor-host/protocol';
import {CommandExecutor} from '../core/command';
import {ModelAccessHost} from '../core/model';
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

export type EditorHost = TaskIdBoundClient<EditorHostProtocol>;

export interface Context {
    modelAccess: ModelAccessHost;
    editorHost: EditorHost;
    commandExecutor: CommandExecutor;
    store: ThreadStore;
    logger: Logger;
}

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
    static functionName?: string;

    constructor(port: Port, request: ExecutionRequest, context: Context) {
        const sendNotice: SendNotice = (action: string, payload?: any) => this.notify(action, payload);
        super(
            port,
            request,
            {
                modelAccess: context.modelAccess,
                editorHost: context.editorHost,
                commandExecutor: context.commandExecutor,
                store: context.store,
                logger: new HandlerLogger(
                    sendNotice,
                    new.target.name,
                    request.taskId,
                    new.target.functionName ?? new.target.name.replace(/Handler$/, '')
                ),
            }
        );
    }

    updateInboxThreadList(threads: MessageThreadData[]): void {
        this.notify('updateInboxThreadList', threads);
    }
}
