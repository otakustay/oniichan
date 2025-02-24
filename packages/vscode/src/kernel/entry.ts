import {MessagePort, parentPort, workerData} from 'node:worker_threads';
import {ExecutionMessage, isExecutionMessage, Port} from '@otakustay/ipc';
import {KernelServer} from '@oniichan/kernel/server';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {ThreadStore, CommandExecutor} from '@oniichan/kernel';
import {stringifyError} from '@oniichan/shared/error';
import {Logger, ConsoleLogger} from '@oniichan/shared/logger';
import {DependencyContainer} from '@oniichan/shared/container';
import {MessageThreadPersistData} from '@oniichan/shared/inbox';

const initialMessageThreads: MessageThreadPersistData[] = [];

if (process.env.NODE_ENV === 'development') {
    initialMessageThreads.push({
        uuid: '8aedcdb8-1114-4df4-a2fd-57dfa4ccd8ce',
        roundtrips: [
            {
                status: 'read',
                request: {
                    uuid: '16e0c25c-9ff2-47ba-8720-c016cfe1eee4',
                    createdAt: '2025-02-24T04:53:34.054Z',
                    type: 'userRequest',
                    content: '删除`chunk`这个运算符',
                },
                responses: [
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: 'c09d23ad-e2d3-4f94-8aad-9c68e7ca3294',
                                createdAt: '2025-02-24T04:53:34.060Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '我将帮助删除`chunk`运算符及其相关测试文件。根据项目结构，`chunk`运算符位于`src/helper/operators/chunk.ts`，其测试文件位于`src/helper/operators/__tests__/chunk.test.ts`。\n\n删除步骤如下：\n1. 删除`chunk.ts`源文件\n2. 删除`chunk.test.ts`测试文件\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/chunk.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/chunk.ts',
                                            oldContent:
                                                'export async function* chunk<T>(iterator: AsyncIterable<T>, size: number): AsyncIterable<T[]> {\n    const state = {\n        current: [] as T[],\n    };\n\n    for await (const value of iterator) {\n        state.current.push(value);\n        if (state.current.length === size) {\n            yield state.current;\n            state.current = [];\n        }\n    }\n\n    if (state.current.length > 0) {\n        yield state.current;\n    }\n}\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 18,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n    <path>src/helper/operators/chunk.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '84613287-6f29-4e0f-8a16-512e936c61e6',
                                    createdAt: '2025-02-24T04:53:41.454Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/chunk.ts is deleted',
                                },
                            ],
                            exposed: [
                                '84613287-6f29-4e0f-8a16-512e936c61e6',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '85a4d1db-cba1-4387-86bf-995d3a456bbc',
                                createdAt: '2025-02-24T04:53:41.455Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content: '现在我将删除对应的测试文件。\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/__tests__/chunk.test.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/__tests__/chunk.test.ts',
                                            oldContent:
                                                'import {expect, test} from \'vitest\';\nimport {chunk} from \'../chunk.js\';\n\nasync function* generate() {\n    yield 1;\n    await Promise.resolve();\n    yield 2;\n    yield 3;\n    await Promise.resolve();\n    yield 4;\n    yield 5;\n}\n\nasync function* empty() {\n}\n\ntest(\'chunk with size 2\', async () => {\n    const iterable = chunk(generate(), 2);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1, 2], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [3, 4], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with size larger than input\', async () => {\n    const iterable = chunk(generate(), 10);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1, 2, 3, 4, 5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with size 1\', async () => {\n    const iterable = chunk(generate(), 1);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [2], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [3], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [4], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with empty input\', async () => {\n    const iterable = chunk(empty(), 2);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 49,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n    <path>src/helper/operators/__tests__/chunk.test.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: 'f337d369-9ac2-4bc9-9b4a-d45df99d922e',
                                    createdAt: '2025-02-24T04:53:45.358Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/__tests__/chunk.test.ts is deleted',
                                },
                            ],
                            exposed: [
                                'f337d369-9ac2-4bc9-9b4a-d45df99d922e',
                            ],
                        },
                    },
                    {
                        type: 'message',
                        message: {
                            uuid: '5eee9261-53f7-4ea2-a931-b7ca8e512a0a',
                            createdAt: '2025-02-24T04:53:45.358Z',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content: '`chunk`运算符及其测试文件已成功删除。操作已完成。\n\n',
                                },
                                {
                                    type: 'toolCall',
                                    toolName: 'attempt_completion',
                                    arguments: {
                                        result:
                                            '已成功删除 chunk 运算符及其测试文件：src/helper/operators/chunk.ts 和 src/helper/operators/__tests__/chunk.test.ts',
                                    },
                                    status: 'completed',
                                    fileEdit: null,
                                    source:
                                        '<attempt_completion>\n    <result>已成功删除 chunk 运算符及其测试文件：src/helper/operators/chunk.ts 和 src/helper/operators/__tests__/chunk.test.ts</result>\n</attempt_completion>',
                                },
                            ],
                        },
                    },
                ],
            },
            {
                status: 'read',
                request: {
                    uuid: '2f2ba3df-8730-4910-802d-ac159bd2906b',
                    createdAt: '2025-02-24T04:54:19.235Z',
                    type: 'userRequest',
                    content:
                        '出现了以下问题：\n\n```\n❌ [build-esm] exited with exit code 2. Output:\n\nsrc/helper/index.ts(3,21): error TS2307: Cannot find module \'./operators/chunk.js\' or its corresponding type declarations.\n⠏\n❌ [build-cjs] exited with exit code 2. Output:\n\nsrc/helper/index.ts(3,21): error TS2307: Cannot find module \'./operators/chunk.js\' or its corresponding type declarations.\n❌ 2 scripts failed.\n```',
                },
                responses: [
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '209bc13b-27d2-4f30-8096-f60fae301404',
                                createdAt: '2025-02-24T04:54:19.239Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '看来在`src/helper/index.ts`中仍然存在对`chunk`运算符的引用。我们需要移除这些引用。让我先查看一下`index.ts`文件的内容。\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'read_file',
                                        arguments: {
                                            path: 'src/helper/index.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: null,
                                        source: '<read_file>\n    <path>src/helper/index.ts</path>\n</read_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '8391b1a5-24e8-4b35-b3b0-cc6c68d3b912',
                                    createdAt: '2025-02-24T04:54:26.119Z',
                                    type: 'toolUse',
                                    content:
                                        'Content of file src/helper/index.ts:\n\n```ts\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n\n```',
                                },
                            ],
                            exposed: [
                                '8391b1a5-24e8-4b35-b3b0-cc6c68d3b912',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '70400f50-d9a2-4f03-8b55-a2b9c1e80fc7',
                                createdAt: '2025-02-24T04:54:26.119Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '我需要从`src/helper/index.ts`中移除所有与`chunk`相关的代码。这包括：\n1. 移除`import {chunk} from \'./operators/chunk.js\';`语句\n2. 移除`OverAsyncIterator`接口中的`chunk`方法声明\n3. 移除`over`函数实现中的`chunk`方法\n\n以下是修改内容：\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'patch_file',
                                        arguments: {
                                            path: 'src/helper/index.ts',
                                            patch:
                                                '\n<<<<<<< SEARCH\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n=======\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n>>>>>>> REPLACE\n    \n<<<<<<< SEARCH\n    chunk(size: number): OverAsyncIterator<T[]>;\n=======\n>>>>>>> REPLACE\n    \n<<<<<<< SEARCH\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n=======\n>>>>>>> REPLACE\n    ',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/index.ts',
                                            oldContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            type: 'edit',
                                            newContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            deletedCount: 12,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<patch_file>\n    <path>src/helper/index.ts</path>\n    <patch>\n<<<<<<< SEARCH\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n=======\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n>>>>>>> REPLACE\n    </patch>\n    <patch>\n<<<<<<< SEARCH\n    chunk(size: number): OverAsyncIterator<T[]>;\n=======\n>>>>>>> REPLACE\n    </patch>\n    <patch>\n<<<<<<< SEARCH\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n=======\n>>>>>>> REPLACE\n    </patch>\n</patch_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '2f214453-e384-4058-81eb-17a7095ea2c6',
                                    createdAt: '2025-02-24T04:54:47.078Z',
                                    type: 'toolUse',
                                    content:
                                        'Patch is written to src/helper/index.ts, here is the new content of this file:\n\n```\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n\n```',
                                },
                            ],
                            exposed: [
                                '2f214453-e384-4058-81eb-17a7095ea2c6',
                            ],
                        },
                    },
                    {
                        type: 'message',
                        message: {
                            uuid: '481627e0-1455-4857-aed9-c635c9afa887',
                            createdAt: '2025-02-24T04:54:47.078Z',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content:
                                        '`chunk`运算符及其相关代码已成功从项目中移除。所有与`chunk`相关的文件、导入和接口声明都已被删除。现在项目应该可以正常构建了。\n\n',
                                },
                                {
                                    type: 'toolCall',
                                    toolName: 'attempt_completion',
                                    arguments: {
                                        result:
                                            '已成功移除所有与 chunk 运算符相关的代码，包括源文件、测试文件以及在 index.ts 中的引用',
                                    },
                                    status: 'completed',
                                    fileEdit: null,
                                    source:
                                        '<attempt_completion>\n    <result>已成功移除所有与 chunk 运算符相关的代码，包括源文件、测试文件以及在 index.ts 中的引用</result>\n</attempt_completion>',
                                },
                            ],
                        },
                    },
                ],
            },
            {
                status: 'read',
                request: {
                    uuid: '08998ec5-bbdd-49e5-ad0d-82cb4b0080f2',
                    createdAt: '2025-02-24T04:55:06.892Z',
                    type: 'userRequest',
                    content: '现在，继续把`until`这个也删了',
                },
                responses: [
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '14a5dd36-fe5d-45b7-abfc-e49da4a7eb91',
                                createdAt: '2025-02-24T04:55:06.898Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '好的，我将帮助删除`until`运算符及其相关测试文件。根据项目结构，`until`运算符位于`src/helper/operators/until.ts`，其测试文件位于`src/helper/operators/__tests__/until.test.ts`。\n\n删除步骤如下：\n1. 删除`until.ts`源文件\n2. 删除`until.test.ts`测试文件\n3. 移除`src/helper/index.ts`中与`until`相关的代码\n\n首先，我将删除`until.ts`源文件：\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/until.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/until.ts',
                                            oldContent:
                                                'import {Predicate} from \'./interface.js\';\n\nexport async function* until<T>(iterator: AsyncIterable<T>, predicate: Predicate<T>): AsyncIterable<T> {\n    for await (const value of iterator) {\n        const stop = await predicate(value);\n\n        if (stop) {\n            break;\n        }\n\n        yield value;\n    }\n}\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 14,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n    <path>src/helper/operators/until.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '023ae65c-43e7-4234-a103-659a7d823462',
                                    createdAt: '2025-02-24T04:55:16.053Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/until.ts is deleted',
                                },
                            ],
                            exposed: [
                                '023ae65c-43e7-4234-a103-659a7d823462',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '400ca167-0c0c-426b-be29-6a91481d0f3d',
                                createdAt: '2025-02-24T04:55:16.053Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content: '接下来，我将删除对应的测试文件。\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/__tests__/until.test.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/__tests__/until.test.ts',
                                            oldContent:
                                                'import {expect, test} from \'vitest\';\nimport {until} from \'../until.js\';\n\nasync function* generate() {\n    yield 1;\n    await Promise.resolve();\n    yield 2;\n    yield 3;\n    await Promise.resolve();\n    yield 4;\n    yield 5;\n}\n\nasync function* empty() {\n}\n\ntest(\'until with predicate stopping at 3\', async () => {\n    const iterable = until(generate(), value => value === 3);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: 1, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 2, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'allow predicate to return promise\', async () => {\n    const iterable = until(generate(), value => Promise.resolve(value === 3));\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: 1, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 2, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'until with predicate never met\', async () => {\n    const iterable = until(generate(), value => value > 10);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: 1, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 2, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 3, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 4, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: 5, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'until with predicate met immediately\', async () => {\n    const iterable = until(generate(), value => value >= 2);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: 1, done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'until with empty input\', async () => {\n    const iterable = until(empty(), () => true);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 56,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n    <path>src/helper/operators/__tests__/until.test.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '4c6b55b8-ba27-4668-aa64-bb4d5fea13da',
                                    createdAt: '2025-02-24T04:55:23.291Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/__tests__/until.test.ts is deleted',
                                },
                            ],
                            exposed: [
                                '4c6b55b8-ba27-4668-aa64-bb4d5fea13da',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '22c4dd90-a47b-4758-b2b0-30cb3ebc9cd3',
                                createdAt: '2025-02-24T04:55:23.291Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '现在我将从`src/helper/index.ts`中移除所有与`until`相关的代码。这包括：\n1. 移除`import {until} from \'./operators/until.js\';`语句\n2. 移除`OverAsyncIterator`接口中的`until`方法声明\n3. 移除`over`函数实现中的`until`方法\n\n以下是修改内容：\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'patch_file',
                                        arguments: {
                                            path: 'src/helper/index.ts',
                                            patch:
                                                '\n<<<<<<< SEARCH\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n=======\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\n>>>>>>> REPLACE\n    \n<<<<<<< SEARCH\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n=======\n>>>>>>> REPLACE\n    \n<<<<<<< SEARCH\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n=======\n>>>>>>> REPLACE\n    ',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/index.ts',
                                            oldContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            type: 'edit',
                                            newContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            deletedCount: 13,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<patch_file>\n    <path>src/helper/index.ts</path>\n    <patch>\n<<<<<<< SEARCH\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n=======\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\n>>>>>>> REPLACE\n    </patch>\n    <patch>\n<<<<<<< SEARCH\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n=======\n>>>>>>> REPLACE\n    </patch>\n    <patch>\n<<<<<<< SEARCH\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n=======\n>>>>>>> REPLACE\n    </patch>\n</patch_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: 'f8f86709-2d24-4d28-a942-2c85894fd7d4',
                                    createdAt: '2025-02-24T04:55:43.698Z',
                                    type: 'toolUse',
                                    content:
                                        'Patch is written to src/helper/index.ts, here is the new content of this file:\n\n```\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n\n```',
                                },
                            ],
                            exposed: [
                                'f8f86709-2d24-4d28-a942-2c85894fd7d4',
                            ],
                        },
                    },
                    {
                        type: 'message',
                        message: {
                            uuid: '0da8d67c-f03e-4e7f-acee-d51ec6284595',
                            createdAt: '2025-02-24T04:55:43.699Z',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content:
                                        '`until`运算符及其相关代码已成功从项目中移除。所有与`until`相关的文件、导入和接口声明都已被删除。现在项目应该可以正常构建了。\n\n',
                                },
                                {
                                    type: 'toolCall',
                                    toolName: 'attempt_completion',
                                    arguments: {
                                        result:
                                            '已成功移除所有与 until 运算符相关的代码，包括源文件、测试文件以及在 index.ts 中的引用',
                                    },
                                    status: 'completed',
                                    fileEdit: null,
                                    source:
                                        '<attempt_completion>\n    <result>已成功移除所有与 until 运算符相关的代码，包括源文件、测试文件以及在 index.ts 中的引用</result>\n</attempt_completion>',
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    });
}

class WorkerPort implements Port {
    private readonly port: MessagePort;

    constructor() {
        if (!parentPort) {
            throw new Error('Worker thread is not available');
        }

        this.port = parentPort;
    }

    send(message: ExecutionMessage): void {
        this.port.postMessage(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.port.on(
            'message',
            (data: any) => {
                try {
                    if (isExecutionMessage(data)) {
                        callback(data);
                    }
                }
                catch {
                    // Discard incorrect JSON messages
                }
            }
        );
    }
}

async function main() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const binaryDirectory: string = workerData.privateBinaryDirectory;

    if (!binaryDirectory) {
        console.error(`Binary directory is not specified`);
        process.exit(400);
    }

    try {
        const port = new WorkerPort();
        const container = new DependencyContainer()
            .bind(ThreadStore, () => new ThreadStore(initialMessageThreads), {singleton: true})
            .bind(EditorHostClient, () => new EditorHostClient(port), {singleton: true})
            .bind(Logger, () => new ConsoleLogger('Kernel'), {singleton: true})
            .bind(CommandExecutor, () => new CommandExecutor(binaryDirectory), {singleton: true});
        const server = new KernelServer(container);
        await server.connect(port);
    }
    catch (ex) {
        console.error(`Failed to start kernel in worker: ${stringifyError(ex)}`);
        process.exit(500);
    }
}

void main();
