import {assertNever} from '@oniichan/shared/error';
import type {ToolName} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {AskFollowupQuestionToolImplement} from './askFollowupQuestion';
import {AttemptCompletionToolImplement} from './attemptCompletion';
import type {ToolExecuteResult, ToolImplementInit, Success, ExecuteError} from './base';
import type {ToolImplementBase} from './base';
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
import {CreatePlanToolImplement} from './createPlan';
import {SemanticEditCodeToolImplement} from './semanticEditCode';

export type {ToolExecuteResult, ToolImplementInit, Success, ExecuteError};

export class ToolImplement {
    private readonly readFile: ToolImplementBase;

    private readonly readDirectory: ToolImplementBase;

    private readonly globFiles: ToolImplementBase;

    private readonly grepFiles: ToolImplementBase;

    private readonly writeFile: ToolImplementBase;

    private readonly patchFile: ToolImplementBase;

    private readonly deleteFile: ToolImplementBase;

    private readonly runCommand: ToolImplementBase;

    private readonly browserPreview: ToolImplementBase;

    private readonly attemptCompletion: ToolImplementBase;

    private readonly askFollowupQuestion: ToolImplementBase;

    private readonly completeTask: ToolImplementBase;

    private readonly createPlan: ToolImplementBase;

    private readonly semanticEditCode: ToolImplementBase;

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
        this.createPlan = new CreatePlanToolImplement(init);
        this.semanticEditCode = new SemanticEditCodeToolImplement(init);
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

    extractArguments(toolName: ToolName, generated: Record<string, RawToolCallParameter>): Record<string, any> {
        const implement = this.getImplement(toolName);
        return implement.extractParameters(generated);
    }

    parseArguments(toolName: ToolName, generated: Record<string, any>): any {
        const implement = this.getImplement(toolName);
        const extracted = implement.extractParameters(generated);
        return implement.parseParameters(extracted);
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
            case 'create_plan':
                return this.createPlan;
            case 'semantic_edit_code':
                return this.semanticEditCode;
            default:
                assertNever<string>(name, v => `Unknown tool ${v}`);
        }
    }
}
