import {EditorHostClient} from '@oniichan/editor-host/client';
import {EditorDocumentHost} from './document';
import {ModelAccessHost} from './model';
import {WorkspaceHost} from './workspace';

export class EditorHost {
    private readonly client: EditorHostClient;

    constructor(client: EditorHostClient) {
        this.client = client;
    }

    getDocument(uri: string, taskId?: string) {
        return new EditorDocumentHost(taskId, this.client, uri);
    }

    getModelAccess(taskId?: string) {
        return new ModelAccessHost(taskId, this.client);
    }

    getWorkspace(taskId?: string) {
        return new WorkspaceHost(taskId, this.client);
    }
}
