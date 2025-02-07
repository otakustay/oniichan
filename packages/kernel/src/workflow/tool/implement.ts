import {ModelToolCallInput} from '@oniichan/shared/tool';
import {assertNever} from '@oniichan/shared/error';
import {EditorHost} from '../../editor';
import {ToolImplementBase, ToolRunResult} from './utils';
import {ReadFileToolImplement} from './readFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {GlobFilesToolImplement} from './globFiles';
import {GrepFilesToolImplement} from './grepFiles';
import {RunCommandToolImplement} from './runCommand';

export class ToolImplement {
    private readonly readFile: ToolImplementBase;

    private readonly readDirectory: ToolImplementBase;

    private readonly globFiles: ToolImplementBase;

    private readonly grepFiles: ToolImplementBase;

    private readonly runCommand: ToolImplementBase;

    constructor(editorHost: EditorHost) {
        this.readFile = new ReadFileToolImplement(editorHost);
        this.readDirectory = new ReadDirectoryToolImplement(editorHost);
        this.globFiles = new GlobFilesToolImplement(editorHost);
        this.grepFiles = new GrepFilesToolImplement(editorHost);
        this.runCommand = new RunCommandToolImplement(editorHost);
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
            case 'run_command':
                return this.runCommand.run(input.arguments);
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
