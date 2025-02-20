import url from 'node:url';
import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';

export interface ReadDirectoryOptions {
    depth?: number;
}

export class WorkspaceHost {
    private readonly taskId: string | undefined;

    private readonly client: EditorHostClient;

    constructor(taskId: string | undefined, client: EditorHostClient) {
        this.taskId = taskId;
        this.client = client;
    }

    async readFile(uri: string) {
        return this.client.call(newUuid(this.taskId), 'readFile', uri);
    }

    async readWorkspaceFile(path: string) {
        return this.client.call(newUuid(this.taskId), 'readWorkspaceFile', path);
    }

    async readDirectory(path: string, options?: ReadDirectoryOptions) {
        return this.client.call(newUuid(this.taskId), 'readDirectory', {path, depth: options?.depth});
    }

    async getRoot() {
        const uri = await this.client.call(newUuid(this.taskId), 'getWorkspaceRoot');
        return uri && url.fileURLToPath(uri);
    }

    async findFiles(glob: string, limit?: number) {
        return this.client.call(newUuid(this.taskId), 'findFiles', {glob, limit});
    }

    async getStructure() {
        return this.client.call(newUuid(this.taskId), 'getWorkspaceStructure');
    }
}
