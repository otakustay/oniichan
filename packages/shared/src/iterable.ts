import {AsyncIteratorController} from '@otakustay/async-iterator';
import {counter} from './promise';

export function merge<X, Y>(x: AsyncIterable<X>, y: AsyncIterable<Y>): AsyncIterable<X | Y> {
    const controller = new AsyncIteratorController<X | Y>();
    const wait = counter(2);
    const pipe = async (iterable: AsyncIterable<X | Y>) => {
        try {
            for await (const value of iterable) {
                controller.put(value);
            }
            wait.increment();
        }
        catch (ex) {
            controller.error(ex);
        }
    };
    void pipe(x);
    void pipe(y);
    void wait.meet().then(() => controller.complete());
    return controller.toIterable();
}

export function duplicate<T>(iterable: AsyncIterable<T>): [AsyncIterable<T>, AsyncIterable<T>] {
    const first = new AsyncIteratorController<T>();
    const second = new AsyncIteratorController<T>();
    void (async () => {
        try {
            for await (const value of iterable) {
                first.put(value);
                second.put(value);
            }
            first.complete();
            second.complete();
        }
        catch (ex) {
            first.error(ex);
            second.error(ex);
        }
    })();
    return [first.toIterable(), second.toIterable()];
}
