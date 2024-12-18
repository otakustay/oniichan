import {Client} from '@otakustay/ipc';
import {Protocol} from '@oniichan/host/server';
import {newUuid} from '@oniichan/shared/id';

export interface ReadDirectoryOptions {
    depth?: number;
}

export class WorkspaceHost {
    private readonly taskId: string | undefined;

    private readonly client: Client<Protocol>;

    constructor(taskId: string | undefined, client: Client<Protocol>) {
        this.taskId = taskId;
        this.client = client;
    }

    async readFile(uri: string) {
        return this.client.call(newUuid(this.taskId), 'readFile', uri);
    }

    async readDirectory(path: string, options?: ReadDirectoryOptions) {
        return this.client.call(newUuid(this.taskId), 'readDirectory', {path, depth: options?.depth});
    }
}
