import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';
import type {ToolExecuteResult, ToolProvider, ToolProviderInit} from './base';
import type {SharedToolName} from './shared';
import {AskFollowupQuestionToolImplement} from './askFollowupQuestion';
import {AttemptCompletionToolImplement} from './attemptCompletion';
import {BrowserPreviewToolImplement} from './browserPreview';
import {DeleteFileToolImplement} from './deleteFile';
import {GlobFilesToolImplement} from './globFiles';
import {GrepFilesToolImplement} from './grepFiles';
import {PatchFileToolImplement} from './patchFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {ReadFileToolImplement} from './readFile';
import {RunCommandToolImplement} from './runCommand';
import {WriteFileToolImplement} from './writeFile';

type ToolProviderClass = new(init: ToolProviderInit) => ToolProvider;

const shared: Record<SharedToolName, ToolProviderClass> = {
    ask_followup_question: AskFollowupQuestionToolImplement,
    attempt_completion: AttemptCompletionToolImplement,
    browser_preview: BrowserPreviewToolImplement,
    delete_file: DeleteFileToolImplement,
    find_files_by_glob: GlobFilesToolImplement,
    find_files_by_regex: GrepFilesToolImplement,
    patch_file: PatchFileToolImplement,
    read_directory: ReadDirectoryToolImplement,
    read_file: ReadFileToolImplement,
    run_command: RunCommandToolImplement,
    write_file: WriteFileToolImplement,
};

export class ToolImplement {
    private readonly provider: ToolProvider;

    constructor(provider: ToolProvider) {
        this.provider = provider;
    }

    requireUserApprove(): boolean {
        return this.provider.requireUserApprove();
    }

    executeApprove(args: Record<string, any>): Promise<ToolExecuteResult> {
        return this.provider.executeApprove(args);
    }

    async executeReject(): Promise<string> {
        return this.provider.executeReject();
    }

    extractArguments(generated: Record<string, RawToolCallParameter>): Record<string, any> {
        return this.provider.extractParameters(generated);
    }

    parseArguments(generated: Record<string, any>): any {
        const extracted = this.provider.extractParameters(generated);
        return this.provider.parseParameters(extracted);
    }
}

export class ToolImplementFactory {
    private readonly providers = new Map<ToolName, ToolProviderClass>();

    register(toolName: ToolName, providerClass: ToolProviderClass) {
        this.providers.set(toolName, providerClass);
    }

    registerShared(...names: SharedToolName[]) {
        for (const name of names) {
            this.providers.set(name, shared[name]);
        }
    }

    create(toolName: ToolName, init: ToolProviderInit): ToolImplement {
        const Provider = this.providers.get(toolName);

        if (!Provider) {
            throw new Error(`Tool ${toolName} is not registered`);
        }

        return new ToolImplement(new Provider(init));
    }
}
