import {Client} from '@otakustay/ipc';
import {Protocol as EditorHostProtocol} from '@oniichan/editor-host/server';
import {newUuid} from '@oniichan/shared/id';

export interface ReadDirectoryOptions {
    depth?: number;
}

export class WorkspaceHost {
    private readonly taskId: string | undefined;

    private readonly client: Client<EditorHostProtocol>;

    constructor(taskId: string | undefined, client: Client<EditorHostProtocol>) {
        this.taskId = taskId;
        this.client = client;
    }

    async readFile(uri: string) {
        return this.client.call(newUuid(this.taskId), 'readFile', uri);
    }

    async readDirectory(path: string, options?: ReadDirectoryOptions) {
        return this.client.call(newUuid(this.taskId), 'readDirectory', {path, depth: options?.depth});
    }

    async getRoot() {
        return this.client.call(newUuid(this.taskId), 'getWorkspaceRoot');
    }

    async findFiles(glob: string, limit?: number) {
        return this.client.call(newUuid(this.taskId), 'findFiles', {glob, limit});
    }
}
