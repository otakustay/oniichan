import {Protocol} from '@oniichan/host/server';
import {Client} from '@otakustay/ipc';
import {newUuid} from '@oniichan/shared/id';

// TODO: Maybe it's better to have the same `taskId` for all requests in one business session

export class EditorDocumentHost {
    private readonly taskId: string | undefined;

    private readonly client: Client<Protocol>;

    private readonly uri: string;

    constructor(taskId: string | undefined, client: Client<Protocol>, uri: string) {
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
