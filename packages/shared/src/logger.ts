export type LogLevel = 'trace' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    source: string;
    action: string;
    taskId?: string;
    functionName?: string;
    detail?: Record<string, any>;
}

export interface LoggerOverride {
    source?: string;
    taskId?: string;
    functionName?: string;
}

export class Logger {
    static containerKey = 'Logger' as const;

    private readonly source: string;

    private readonly taskId?: string;

    private readonly functionName?: string;

    constructor(source?: string, taskId?: string, functionName?: string) {
        this.source = source || 'Unknown';
        this.taskId = taskId;
        this.functionName = functionName;
    }

    with(override: LoggerOverride): Logger {
        return new Logger(
            override.source ?? this.source,
            override.taskId ?? this.taskId,
            override.functionName ?? this.functionName
        );
    }

    trace(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('trace', action, detail);
        console.log(entry);
    }

    info(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('info', action, detail);
        console.info(entry);
    }

    warn(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('warn', action, detail);
        console.warn(entry);
    }

    error(action: string, detail?: Record<string, any>) {
        const entry = this.createEntry('error', action, detail);
        console.error(entry);
    }

    private createEntry(level: LogLevel, action: string, detail?: Record<string, any>): LogEntry {
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
        if (process.env.NODE_ENV !== 'production') {
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
