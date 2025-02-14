import {ModelToolCallInput} from '@oniichan/shared/tool';
import {assertNever} from '@oniichan/shared/error';
import {Logger} from '@oniichan/shared/logger';
import {EditorHost} from '../../editor';
import {ToolImplementBase, ToolRunResult} from './utils';
import {ReadFileToolImplement} from './readFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {GlobFilesToolImplement} from './globFiles';
import {GrepFilesToolImplement} from './grepFiles';
import {WriteFileToolImplement} from './writeFile';
import {PatchFilesToolImplement} from './patchFile';
import {DeleteFileToolImplement} from './deleteFile';
import {RunCommandToolImplement} from './runCommand';
import {BrowserPreviewToolImplement} from './browserPreview';

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

    constructor(editorHost: EditorHost, logger: Logger) {
        this.readFile = new ReadFileToolImplement(editorHost);
        this.readDirectory = new ReadDirectoryToolImplement(editorHost);
        this.globFiles = new GlobFilesToolImplement(editorHost);
        this.grepFiles = new GrepFilesToolImplement(editorHost, logger);
        this.writeFile = new WriteFileToolImplement(editorHost);
        this.patchFile = new PatchFilesToolImplement(editorHost);
        this.deleteFile = new DeleteFileToolImplement(editorHost);
        this.runCommand = new RunCommandToolImplement(editorHost, logger);
        this.browserPreview = new BrowserPreviewToolImplement(editorHost);
    }

    async callTool(input: ModelToolCallInput): Promise<ToolRunResult> {
        switch (input.name) {
            case 'read_directory':
                return this.readDirectory.run(input.arguments);
            case 'read_file':
                return this.readFile.run(input.arguments);
            case 'find_files_by_glob':
                return this.globFiles.run(input.arguments);
            case 'find_files_by_regex':
                return this.grepFiles.run(input.arguments);
            case 'write_file':
                return this.writeFile.run(input.arguments);
            case 'patch_file':
                return this.patchFile.run(input.arguments);
            case 'delete_file':
                return this.deleteFile.run(input.arguments);
            case 'run_command':
                return this.runCommand.run(input.arguments);
            case 'browser_preview':
                return this.browserPreview.run(input.arguments);
            case 'attempt_completion':
            case 'ask_followup_question':
                return {
                    type: 'success',
                    finished: true,
                    output: '',
                };
            default:
                assertNever<string>(input.name, v => `Unknown tool ${v}`);
        }
    }
}
