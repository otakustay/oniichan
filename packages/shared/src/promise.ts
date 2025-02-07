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

export function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
