import {Disposable, OutputChannel, window} from 'vscode';
import {ConsoleLogger, LogEntry, Logger, LoggerScope} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';

export class OutputChannelProvider implements Disposable {
    static containerKey = 'OutputChannelProvider' as const;

    private readonly outputChannel: OutputChannel;

    constructor() {
        this.outputChannel = window.createOutputChannel('Oniichan', 'jsonl');
    }

    append(entry: LogEntry) {
        this.outputChannel.appendLine(JSON.stringify(entry));
    }

    dispose() {
        this.outputChannel.dispose();
    }
}

interface Dependency {
    [OutputChannelProvider.containerKey]: OutputChannelProvider;
}

export class OutputLogger extends Logger {
    private readonly container: DependencyContainer<Dependency>;

    private readonly console: ConsoleLogger;

    constructor(container: DependencyContainer<Dependency>, source?: string, taskId?: string, functionName?: string) {
        super(source, taskId, functionName);
        this.console = new ConsoleLogger(source, taskId, functionName);
        this.container = container;
    }

    print(entry: LogEntry): void {
        const outputChannel = this.container.get(OutputChannelProvider);
        outputChannel.append(entry);

        if (process.env.NODE_ENV === 'development') {
            this.console.print(entry);
        }
    }

    with(override: LoggerScope): Logger {
        return new OutputLogger(
            this.container,
            override.source ?? this.source,
            override.taskId ?? this.taskId,
            override.functionName ?? this.functionName
        );
    }
}
