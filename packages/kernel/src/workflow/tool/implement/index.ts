import {assertNever} from '@oniichan/shared/error';
import type {ToolName} from '@oniichan/shared/tool';
import {AskFollowupQuestionToolImplement} from './askFollowupQuestion';
import {AttemptCompletionToolImplement} from './attemptCompletion';
import type {ToolExecuteResult, ToolImplementInit, Success, ExecuteError} from './base';
import * as base from './base';
import {ToolImplementBase} from './base';
import {BrowserPreviewToolImplement} from './browserPreview';
import {DeleteFileToolImplement} from './deleteFile';
import {GlobFilesToolImplement} from './globFiles';
import {GrepFilesToolImplement} from './grepFiles';
import {PatchFilesToolImplement} from './patchFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {ReadFileToolImplement} from './readFile';
import {RunCommandToolImplement} from './runCommand';
import {WriteFileToolImplement} from './writeFile';
import {CompleteTaskToolImplement} from './completeTask';

export {ToolImplementBase};
export type {ToolExecuteResult, ToolImplementInit, Success, ExecuteError};

export class ToolImplement {
    private readonly readFile: base.ToolImplementBase;

    private readonly readDirectory: base.ToolImplementBase;

    private readonly globFiles: base.ToolImplementBase;

    private readonly grepFiles: base.ToolImplementBase;

    private readonly writeFile: base.ToolImplementBase;

    private readonly patchFile: base.ToolImplementBase;

    private readonly deleteFile: base.ToolImplementBase;

    private readonly runCommand: base.ToolImplementBase;

    private readonly browserPreview: base.ToolImplementBase;

    private readonly attemptCompletion: base.ToolImplementBase;

    private readonly askFollowupQuestion: base.ToolImplementBase;

    private readonly completeTask: base.ToolImplementBase;

    constructor(init: ToolImplementInit) {
        this.readFile = new ReadFileToolImplement(init);
        this.readDirectory = new ReadDirectoryToolImplement(init);
        this.globFiles = new GlobFilesToolImplement(init);
        this.grepFiles = new GrepFilesToolImplement(init);
        this.writeFile = new WriteFileToolImplement(init);
        this.patchFile = new PatchFilesToolImplement(init);
        this.deleteFile = new DeleteFileToolImplement(init);
        this.runCommand = new RunCommandToolImplement(init);
        this.browserPreview = new BrowserPreviewToolImplement(init);
        this.attemptCompletion = new AttemptCompletionToolImplement(init);
        this.askFollowupQuestion = new AskFollowupQuestionToolImplement(init);
        this.completeTask = new CompleteTaskToolImplement(init);
    }

    requireUserApprove(toolName: ToolName): boolean {
        const implement = this.getImplement(toolName);
        return implement.requireUserApprove();
    }

    executeApprove(toolName: ToolName, args: Record<string, any>): Promise<ToolExecuteResult> {
        const implement = this.getImplement(toolName);
        return implement.executeApprove(args);
    }

    async executeReject(toolName: ToolName): Promise<string> {
        const implement = this.getImplement(toolName);
        return implement.executeReject();
    }

    extractArguments(toolName: ToolName, generated: Record<string, string | undefined>): Record<string, unknown> {
        const implement = this.getImplement(toolName);
        return implement.extractParameters(generated);
    }

    private getImplement(name: ToolName) {
        switch (name) {
            case 'read_directory':
                return this.readDirectory;
            case 'read_file':
                return this.readFile;
            case 'find_files_by_glob':
                return this.globFiles;
            case 'find_files_by_regex':
                return this.grepFiles;
            case 'write_file':
                return this.writeFile;
            case 'patch_file':
                return this.patchFile;
            case 'delete_file':
                return this.deleteFile;
            case 'run_command':
                return this.runCommand;
            case 'browser_preview':
                return this.browserPreview;
            case 'attempt_completion':
                return this.attemptCompletion;
            case 'ask_followup_question':
                return this.askFollowupQuestion;
            case 'complete_task':
                return this.completeTask;
            default:
                assertNever<string>(name, v => `Unknown tool ${v}`);
        }
    }
}
