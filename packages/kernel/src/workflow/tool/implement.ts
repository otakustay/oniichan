import {ModelToolCallInput, ToolName} from '@oniichan/shared/tool';
import {assertNever} from '@oniichan/shared/error';
import {ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';
import {ReadFileToolImplement} from './readFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {GlobFilesToolImplement} from './globFiles';
import {GrepFilesToolImplement} from './grepFiles';
import {WriteFileToolImplement} from './writeFile';
import {PatchFilesToolImplement} from './patchFile';
import {DeleteFileToolImplement} from './deleteFile';
import {RunCommandToolImplement} from './runCommand';
import {BrowserPreviewToolImplement} from './browserPreview';
import {AttemptCompletionToolImplement} from './attemptCompletion';
import {AskFollowupQuestionToolImplement} from './askFollowupQuestion';

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
    }

    async *callTool(input: ModelToolCallInput): AsyncIterable<ToolRunStep> {
        const implement = this.getImplement(input.name);

        yield* implement.run(input.arguments);
    }

    async rejectTool(input: ModelToolCallInput): Promise<ToolRunStep> {
        const implement = this.getImplement(input.name);

        return implement.reject();
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
            default:
                assertNever<string>(name, v => `Unknown tool ${v}`);
        }
    }
}
