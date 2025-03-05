import {InboxConfig} from '@oniichan/editor-host/protocol';
import {Logger} from '@oniichan/shared/logger';
import {createFileEdit, FileEditData, PatchAction, stackFileEdit} from '@oniichan/shared/patch';
import {stringifyError} from '@oniichan/shared/error';
import {isFileEditToolCallChunk} from '@oniichan/shared/inbox';
import {CommandExecutor} from '../../../core/command';
import {EditorHost} from '../../../core/editor';
import {assertToolCallMessage, InboxMessage, InboxRoundtrip, InboxToolCallMessage} from '../../../inbox';

export interface ToolImplementInit {
    roundtrip: InboxRoundtrip;
    editorHost: EditorHost;
    logger: Logger;
    commandExecutor: CommandExecutor;
    inboxConfig: InboxConfig;
}

export interface Success {
    type: 'success';
    finished: boolean;
    output: string;
}

export interface ExecuteError {
    type: 'executeError';
    output: string;
}

export type ToolExecuteResult = Success | ExecuteError;

export abstract class ToolImplementBase<A extends Partial<Record<keyof A, any>> = Record<string, any>> {
    protected readonly roundtrip: InboxRoundtrip;

    protected readonly editorHost: EditorHost;

    protected readonly logger: Logger;

    protected readonly commandExecutor: CommandExecutor;

    protected readonly inboxConfig: InboxConfig;

    constructor(init: ToolImplementInit) {
        this.roundtrip = init.roundtrip;
        this.editorHost = init.editorHost;
        this.logger = init.logger.with({source: new.target.name});
        this.commandExecutor = init.commandExecutor;
        this.inboxConfig = init.inboxConfig;
    }

    requireUserApprove(): boolean {
        return false;
    }

    async executeReject(): Promise<string> {
        throw new Error('This tool does not support reject');
    }

    abstract executeApprove(args: A): Promise<ToolExecuteResult>;

    abstract extractParameters(generated: Record<string, string | undefined>): Partial<A>;

    protected getToolCallChunkStrict() {
        const origin = this.roundtrip.getLatestWorkflowStrict().getOriginMessage();
        assertToolCallMessage(origin);
        return origin.findToolCallChunkStrict();
    }

    protected async applyFileEdit(file: string, patchAction: PatchAction, patch: string): Promise<FileEditData> {
        const fileEdit = await this.createFileEdit(file, patchAction, patch);
        try {
            switch (fileEdit.type) {
                case 'create':
                case 'edit':
                    await this.editorHost.call(
                        'writeWorkspaceFile',
                        {file: fileEdit.file, content: fileEdit.newContent}
                    );
                    break;
                case 'delete':
                    await this.editorHost.call('deleteWorkspaceFile', fileEdit.file);
                    break;
            }
            return fileEdit;
        }
        catch (ex) {
            return {
                file,
                type: 'error',
                errorType: 'unknown',
                message: stringifyError(ex),
            };
        }
    }

    private async createFileEdit(file: string, patchAction: PatchAction, patch: string): Promise<FileEditData> {
        const editStack = this.getEditStackForFile(file);
        const previousEdit = editStack.at(-1);

        if (previousEdit) {
            return stackFileEdit(previousEdit, patchAction, patch);
        }
        else {
            try {
                const content = await this.editorHost.call('readWorkspaceFile', file);
                return createFileEdit(file, content, patchAction, patch);
            }
            catch (ex) {
                return {
                    file,
                    type: 'error',
                    errorType: 'unknown',
                    message: stringifyError(ex),
                };
            }
        }
    }

    private getEditStackForFile(file: string): FileEditData[] {
        const messages = this.roundtrip.toMessages();
        return messages
            .filter((v: InboxMessage): v is InboxToolCallMessage => v.type === 'toolCall')
            .map(v => v.findToolCallChunkStrict())
            .filter(isFileEditToolCallChunk)
            .flatMap(v => v.executionData ?? [])
            .filter(v => v.file === file);
    }
}
