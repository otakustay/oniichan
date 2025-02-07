import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';

export interface RunCommandOptions {
    command: string;
    cwd: string;
}

export class TerminalHost {
    private readonly taskId: string | undefined;

    private readonly client: EditorHostClient;

    constructor(taskId: string | undefined, client: EditorHostClient) {
        this.taskId = taskId;
        this.client = client;
    }

    async runCommand({command, cwd}: RunCommandOptions) {
        return this.client.call(newUuid(this.taskId), 'executeTerminal', {command, cwd, timeout: 1000 * 10});
    }
}
