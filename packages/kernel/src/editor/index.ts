import {Client} from '@otakustay/ipc';
import {Protocol} from '@oniichan/editor-host/server';
import {EditorDocumentHost} from './document';
import {ModelAccessHost} from './model';
import {WorkspaceHost} from './workspace';

export class EditorHost {
    private readonly client: Client<Protocol>;

    constructor(client: Client<Protocol>) {
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
