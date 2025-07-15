import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import type {ToolName} from '@oniichan/shared/tool';
import type {ToolExecuteResult, ToolProvider, ToolProviderInit} from './base.js';
import type {SharedToolName} from './shared.js';
import {AskFollowupQuestionToolImplement} from './askFollowupQuestion.js';
import {AttemptCompletionToolImplement} from './attemptCompletion.js';
import {BrowserPreviewToolImplement} from './browserPreview.js';
import {DeleteFileToolImplement} from './deleteFile.js';
import {SearchInWorkspaceToolImplement} from './searchInWorkspace.js';
import {PatchFileToolImplement} from './patchFile.js';
import {ReadDirectoryToolImplement} from './readDirectory.js';
import {ReadFileToolImplement} from './readFile.js';
import {RunCommandToolImplement} from './runCommand.js';
import {WriteFileToolImplement} from './writeFile.js';
import {EvaluateCodeToolImplement} from './evaluateCode.js';

type ToolProviderClass = new(init: ToolProviderInit) => ToolProvider;

const shared: Record<SharedToolName, ToolProviderClass> = {
    ask_followup_question: AskFollowupQuestionToolImplement,
    attempt_completion: AttemptCompletionToolImplement,
    browser_preview: BrowserPreviewToolImplement,
    delete_file: DeleteFileToolImplement,
    search_in_workspace: SearchInWorkspaceToolImplement,
    patch_file: PatchFileToolImplement,
    read_directory: ReadDirectoryToolImplement,
    read_file: ReadFileToolImplement,
    run_command: RunCommandToolImplement,
    write_file: WriteFileToolImplement,
    evaluate_code: EvaluateCodeToolImplement,
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
