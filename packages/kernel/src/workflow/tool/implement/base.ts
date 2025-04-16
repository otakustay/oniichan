import type {InboxConfig} from '@oniichan/editor-host/protocol';
import type {Logger} from '@oniichan/shared/logger';
import {createFileEdit, stackFileEdit} from '@oniichan/shared/patch';
import type {FileEditData, PatchAction} from '@oniichan/shared/patch';
import {stringifyError} from '@oniichan/shared/error';
import {isFileEditToolCallChunk} from '@oniichan/shared/inbox';
import type {ParsedToolCallMessageChunkOf, RawToolCallParameter, ToolUseResultType} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';
import type {CommandExecutor} from '../../../core/command';
import type {EditorHost} from '../../../core/editor';
import {assertToolCallMessage, assertToolCallType} from '../../../inbox';
import type {InboxMessage, InboxMessageThread, InboxRoundtrip, InboxToolCallMessage} from '../../../inbox';

export interface ToolImplementInit {
    thread: InboxMessageThread;
    roundtrip: InboxRoundtrip;
    editorHost: EditorHost;
    logger: Logger;
    commandExecutor: CommandExecutor;
    inboxConfig: InboxConfig;
}

export interface ToolExecuteResult {
    type: ToolUseResultType;
    finished: boolean;
    template: string;
    executionData: Record<string, string | number | null>;
}

export abstract class ToolImplementBase<A = unknown, E = Partial<A>> {
    protected readonly thread: InboxMessageThread;

    protected readonly roundtrip: InboxRoundtrip;

    protected readonly editorHost: EditorHost;

    protected readonly logger: Logger;

    protected readonly commandExecutor: CommandExecutor;

    protected readonly inboxConfig: InboxConfig;

    constructor(init: ToolImplementInit) {
        this.thread = init.thread;
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

    abstract extractParameters(generated: Record<string, RawToolCallParameter>): E;

    abstract parseParameters(extracted: E): A;

    protected getToolCallChunkStrict<N extends ToolName>(toolName: N): ParsedToolCallMessageChunkOf<N> {
        const origin = this.roundtrip.getLatestWorkflowStrict().getOriginMessage();
        assertToolCallMessage(origin);
        const chunk = origin.findToolCallChunkStrict();
        assertToolCallType(chunk, toolName);
        return chunk;
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
