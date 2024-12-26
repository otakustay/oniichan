export type LogLevel = 'trace' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    source: string;
    action: string;
    taskId?: string;
    functionName?: string;
    detail?: Record<string, any>;
}

export interface LoggerScope {
    source?: string;
    taskId?: string;
    functionName?: string;
}

export abstract class Logger {
    static containerKey = 'Logger' as const;

    protected readonly source: string;

    protected readonly taskId?: string;

    protected readonly functionName?: string;

    constructor(source?: string, taskId?: string, functionName?: string) {
        this.source = source || 'Unknown';
        this.taskId = taskId;
        this.functionName = functionName;
    }

    trace(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('trace', action, detail);
        this.print(entry);
    }

    info(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('info', action, detail);
        this.print(entry);
    }

    warn(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('warn', action, detail);
        this.print(entry);
    }

    error(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('error', action, detail);
        this.print(entry);
    }

    abstract print(entry: LogEntry): void;

    abstract with(override: LoggerScope): Logger;

    toScope(): LoggerScope {
        return {
            source: this.source,
            taskId: this.taskId,
            functionName: this.functionName,
        };
    }

    protected createEntry(level: LogLevel, action: string, detail?: Record<string, any>): LogEntry {
        const source = this.source;
        const entry: LogEntry = {
            level,
            functionName: this.functionName,
            taskId: this.taskId,
            source,
            action,
            detail,
        };

        // Prevent VSCode from printing `undefined` in Debug Console
        if (process.env.NODE_ENV === 'development') {
            const output: Record<string, any> = {};
            for (const [key, value] of Object.entries(entry)) {
                if (value !== undefined) {
                    output[key] = value;
                }
            }
            return output as LogEntry;
        }

        return entry;
    }
}

export class ConsoleLogger extends Logger {
    with(override: LoggerScope): Logger {
        return new ConsoleLogger(
            override.source ?? this.source,
            override.taskId ?? this.taskId,
            override.functionName ?? this.functionName
        );
    }

    print(entry: LogEntry): void {
        switch (entry.level) {
            case 'error':
                console.log(entry);
                break;
            case 'warn':
                console.warn(entry);
                break;
            default:
                console.log(entry);
                break;
        }
    }
}
