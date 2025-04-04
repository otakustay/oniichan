interface Resolver<T> {
    resolve(value: T): void;
    reject(reason: Error): void;
}

export interface Deferred<T> extends Resolver<T> {
    promise: Promise<T>;
}

export function defer<T>(): Deferred<T> {
    const resolvers: Resolver<T> = {
        resolve: () => {},
        reject: () => {},
    };
    const promise = new Promise<T>((resolve, reject) => Object.assign(resolvers, {resolve, reject}));
    return {
        ...resolvers,
        promise,
    };
}

export interface WaitConditionOptions {
    interval: number;
    timeout: number;
}

export function waitCondition(test: () => boolean, options: WaitConditionOptions): Promise<boolean> {
    const deferred = defer<boolean>();
    const start = Date.now();
    const wait = () => {
        const pass = test();
        if (pass) {
            deferred.resolve(true);
            return;
        }

        if (Date.now() - start > options.timeout) {
            deferred.resolve(false);
            return;
        }

        setTimeout(wait, options.interval);
    };
    wait();
    return deferred.promise;
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function counter(count: number) {
    const current = {value: 0};
    // https://github.com/typescript-eslint/typescript-eslint/issues/8113
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const deferred = defer<void>();
    return {
        increment: () => {
            current.value++;
            if (current.value >= count) {
                deferred.resolve();
            }
        },
        meet() {
            return deferred.promise;
        },
    };
}
