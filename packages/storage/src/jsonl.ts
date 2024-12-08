import path from 'node:path';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createReadStream} from 'node:fs';
import readline from 'node:readline';
import {dataDirectory} from '@oniichan/shared/dir';
import {ReferenceCount} from './reference';

export interface JsonlStore<T> extends AsyncDisposable {
    add(this: JsonlStore<T>, data: T): Promise<void>;
    read(this: JsonlStore<T>): AsyncIterable<T>;
}

const storeReferences = new ReferenceCount<JsonlStore<any>>();

class MockJsonlStore<T> implements JsonlStore<T> {
    async add() {
    }
    async *read() {
    }
    async [Symbol.asyncDispose]() {
    }
}

class FileJsonlStore<T> implements JsonlStore<T> {
    private readonly name: string;
    private readonly file: string;

    constructor(name: string, file: string) {
        this.name = name;
        this.file = file;
    }

    async add(data: T) {
        if (!existsSync(this.file)) {
            await fs.writeFile(this.file, JSON.stringify(data) + '\n');
            return;
        }

        const isEndsWithNewLine = await this.isFileEndsWithNewLine();

        if (!isEndsWithNewLine) {
            console.warn(`File ${this.file} does not end with a newline, maybe modified by human`);
        }

        const jsonText = JSON.stringify(data);
        await fs.appendFile(this.file, (isEndsWithNewLine ? jsonText : '\n' + jsonText) + '\n');
    }

    async *read() {
        if (!existsSync(this.file)) {
            return;
        }

        const stream = createReadStream(this.file);
        for await (const line of readline.createInterface(stream)) {
            if (line.trim()) {
                yield JSON.parse(line);
            }
        }
    }

    async [Symbol.asyncDispose]() {
        storeReferences.release(this.name);
        return Promise.resolve();
    }

    private async isFileEndsWithNewLine() {
        const fd = await fs.open(this.file);
        try {
            const stat = await fd.stat();
            const result = await fd.read(Buffer.alloc(2), 0, 2, stat.size - 2);
            return result.bytesRead === 2 && result.buffer.toString() === '}\n';
        }
        finally {
            await fd.close();
        }
    }
}

export interface JsonlStoreInit {
    allowMockOnFail: boolean;
}

const DEFAULT_INIT: JsonlStoreInit = {allowMockOnFail: false};

export async function createJsonlStore<T>(name: string, options = DEFAULT_INIT): Promise<JsonlStore<T>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return storeReferences.get(
        name,
        async () => {
            const directory = await dataDirectory();

            if (!directory) {
                if (options.allowMockOnFail) {
                    return new MockJsonlStore<T>();
                }

                throw new Error('No write permission to data directory');
            }

            const file = path.join(directory, `${name}.jsonl`);
            return new FileJsonlStore<T>(name, file);
        }
    );
}
