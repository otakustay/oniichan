import {Disposable} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {stringifyError} from '@oniichan/shared/error';
import {Logger} from '@oniichan/shared/logger';

export class DisposableAbortSignal extends Disposable {
    readonly signal: AbortSignal;

    constructor(signal: AbortSignal, onDispose: () => void) {
        super(onDispose);
        this.signal = signal;
    }
}

interface DependencyBase {
    [Logger.containerKey]: Logger;
}

export class TaskContext implements Disposable {
    static containerKey = 'TaskContext' as const;

    private readonly taskId: string;

    private readonly logger: Logger;

    private readonly onFinish: () => void;

    private readonly disposables = new Set<Disposable>();

    private readonly pendings = new Set<Promise<void>>();

    constructor(taskId: string, container: DependencyContainer<DependencyBase>, onFinish: () => void) {
        this.taskId = taskId;
        this.logger = container.get(Logger).with({source: 'TaskContext'});
        this.onFinish = onFinish;
    }

    getTaskId() {
        return this.taskId;
    }

    addPending(promise: Promise<void>) {
        this.logger.trace('AddPending');
        void promise.finally(() => this.resolve(promise));
    }

    addDisposable(disposable: Disposable) {
        this.logger.trace('AddDisposable');
        this.disposables.add(disposable);
    }

    dispose() {
        this.logger.trace('DisposeStart');
        Disposable.from(...this.disposables).dispose();
        this.disposables.clear();
        this.logger.trace('DisposeFinish');
    }

    private resolve(promsie: Promise<void>) {
        this.logger.trace('ResolvePending');
        this.pendings.delete(promsie);

        if (this.pendings.size === 0) {
            this.onFinish();
            this.dispose();
        }
    }
}

type TaskContextDependency = Record<typeof TaskContext.containerKey, TaskContext>;

export type TaskContainer<D extends DependencyBase> = DependencyContainer<D & TaskContextDependency>;

type Task<D extends DependencyBase> = (container: TaskContainer<D>) => Promise<void>;

export class TaskManager {
    static containerKey = 'TaskManager' as const;

    private readonly tasks = new Map<string, TaskContext>();

    runTask<D extends DependencyBase>(taskId: string, container: DependencyContainer<D>, task: Task<D>) {
        const context = this.tasks.get(taskId) ?? new TaskContext(taskId, container, () => this.tasks.delete(taskId));
        this.tasks.set(taskId, context);

        const taskContainer = container.bind(TaskContext, () => context, {singleton: true});
        try {
            const promise = task(taskContainer).catch((ex: unknown) => this.handleError(ex, container));
            context.addPending(promise);
            return promise;
        }
        catch (ex) {
            this.handleError(ex, container);
        }
    }

    // In line this method into `runTask` will cause a type error
    private handleError(ex: unknown, container: DependencyContainer<DependencyBase>) {
        const logger = container.get(Logger);
        logger.error('Fail', {reason: stringifyError(ex)});
    }
}
