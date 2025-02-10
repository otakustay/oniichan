import {EditorHostClient} from '@oniichan/editor-host/client';
import {newUuid} from '@oniichan/shared/id';

const DEFAULT_COMMAND_TIMEOUT = 5 * 60 * 1000;

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
        return this.client.call(
            newUuid(this.taskId),
            'executeTerminal',
            {
                command,
                cwd,
                timeout: DEFAULT_COMMAND_TIMEOUT,
            }
        );
    }
}
