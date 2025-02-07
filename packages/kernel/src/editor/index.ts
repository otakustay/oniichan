import {EditorHostClient} from '@oniichan/editor-host/client';
import {EditorDocumentHost} from './document';
import {ModelAccessHost} from './model';
import {WorkspaceHost} from './workspace';
import {TerminalHost} from './terminal';

export {ModelAccessHost, ModelChatOptions} from './model';
export {ReadDirectoryOptions, WorkspaceHost} from './workspace';
export {EditorDocumentHost} from './document';
export {TerminalHost, RunCommandOptions} from './terminal';

export class EditorHost {
    static readonly containerKey = 'EditorHost';

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

    getTerminal(taskId?: string) {
        return new TerminalHost(taskId, this.client);
    }
}
