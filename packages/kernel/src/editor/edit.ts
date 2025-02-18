import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';
import {FileEditData} from '@oniichan/shared/patch';
import {AppliableState} from '@oniichan/editor-host/protocol';

export interface ReadDirectoryOptions {
    depth?: number;
}

export class FileEditHost {
    private readonly taskId: string | undefined;

    private readonly client: EditorHostClient;

    constructor(taskId: string | undefined, client: EditorHostClient) {
        this.taskId = taskId;
        this.client = client;
    }

    async checkAppliable(stack: FileEditData[]): Promise<AppliableState> {
        return this.client.call(newUuid(this.taskId), 'checkEditAppliable', stack);
    }
}
