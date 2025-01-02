import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';

export class EditorDocumentHost {
    private readonly taskId: string | undefined;

    private readonly client: EditorHostClient;

    private readonly uri: string;

    constructor(taskId: string | undefined, client: EditorHostClient, uri: string) {
        this.taskId = taskId;
        this.client = client;
        this.uri = uri;
    }

    async getText() {
        return this.client.call(newUuid(this.taskId), 'getDocumentText', this.uri);
    }

    async getLanguageId() {
        return this.client.call(newUuid(this.taskId), 'getDocumentLanguageId', this.uri);
    }

    async getDiagnosticsAtLine(line: number) {
        return this.client.call(newUuid(this.taskId), 'getDocumentDiagnosticAtLine', {uri: this.uri, line});
    }
}
