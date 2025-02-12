import {Predicate, Transform} from './operators/interface.js';
import {filter} from './operators/filter.js';
import {chunk} from './operators/chunk.js';
import {debounce} from './operators/debounce.js';
import {map} from './operators/map.js';
import {take} from './operators/take.js';
import {until} from './operators/until.js';

export interface OverAsyncIterator<T> extends AsyncIterable<T> {
    filter(predicate: Predicate<T>): OverAsyncIterator<T>;
    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;
    chunk(size: number): OverAsyncIterator<T[]>;
    debounce(ms: number): OverAsyncIterator<T[]>;
    take(count: number): OverAsyncIterator<T>;
    until(predicate: Predicate<T>): OverAsyncIterator<T>;
}

export function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {
    return {
        /**
         * Filter elements wiht a predicate
         *
         * @param predicate Predicate function to decide if an element should be yielded or not
         * @returns A new `OverAsyncIterator` instance including the `filter` operator
         */
        filter(predicate: Predicate<T>): OverAsyncIterator<T> {
            return over(filter(iterable, predicate));
        },

        /**
         * Map elements wiht a transformer
         *
         * @param transform Transform function to transform an element into another
         * @returns A new `OverAsyncIterator` instance including the `map` operator
         */
        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {
            return over(map(iterable, transform));
        },

        /**
         * Group elements into chunks by a size
         *
         * @param size Chunk size
         * @returns A new `OverAsyncIterator` instance including the `chunk` operator
         */
        chunk(size: number): OverAsyncIterator<T[]> {
            return over(chunk(iterable, size));
        },

        /**
         * Debounce the emit of element by a given amount of time,
         * all elements within debounce timeout will emit once as an array
         *
         * @param ms Debounce timeout
         * @returns A new `OverAsyncIterator` instance including the `debounce` operator
         */
        debounce(ms: number): OverAsyncIterator<T[]> {
            return over(debounce(iterable, ms));
        },

        /**
         * Take the first n elements
         *
         * @param count element count to be token
         * @returns A new `OverAsyncIterator` instance including the `take` operator
         */
        take(count: number): OverAsyncIterator<T> {
            return over(take(iterable, count));
        },

        /**
         * Take elements until a predicate match
         *
         * @param predicate Predicate function to decide if the iterator should stop,
         * the element match the predicate will not yield
         * @returns A new `OverAsyncIterator` instance including the `until` operator
         */
        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {
            return over(until(iterable, predicate));
        },

        [Symbol.asyncIterator]() {
            return iterable[Symbol.asyncIterator]();
        },
    };
}
