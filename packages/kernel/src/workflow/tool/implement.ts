import {ModelToolCallInput} from '@oniichan/shared/tool';
import {EditorHost} from '../../editor';
import {ToolImplementBase} from './utils';
import {ReadFileToolImplement} from './readFile';
import {ReadDirectoryToolImplement} from './readDirectory';
import {GlobFilesToolImplement} from './globFiles';

export class ToolImplement {
    private readonly readFile: ToolImplementBase;

    private readonly readDirectory: ToolImplementBase;

    private readonly globFiles: ToolImplementBase;

    constructor(editorHost: EditorHost) {
        this.readFile = new ReadFileToolImplement(editorHost);
        this.readDirectory = new ReadDirectoryToolImplement(editorHost);
        this.globFiles = new GlobFilesToolImplement(editorHost);
    }

    async callTool(input: ModelToolCallInput): Promise<string> {
        switch (input.name) {
            case 'read_directory':
                return this.readDirectory.run(input.arguments);
            case 'read_file':
                return this.readFile.run(input.arguments);
            case 'find_files_by_glob':
                return this.globFiles.run(input.arguments);
            default:
                throw new Error(`Unknown tool ${input.name}`);
        }
    }
}
