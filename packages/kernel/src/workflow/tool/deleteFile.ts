import {deleteFileParameters, DeleteFileParameter} from '@oniichan/shared/tool';
import {EditorHost} from '../../editor';
import {ToolImplementBase, ToolRunResult} from './utils';

export class DeleteFileToolImplement extends ToolImplementBase<DeleteFileParameter> {
    constructor(editorHost: EditorHost) {
        super(editorHost, deleteFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
        };
    }

    protected async execute(args: DeleteFileParameter): Promise<ToolRunResult> {
        const workspace = this.editorHost.getWorkspace();
        const content = await workspace.readWorkspaceFile(args.path);

        if (content) {
            // TODO: We are not writing to file directly, only back to LLM pretending the write is successful
            return {
                type: 'success',
                finished: false,
                output: `File ${args.path} is deleted`,
            };
        }
        else {
            return {
                type: 'success',
                finished: false,
                output:
                    `You're deleting a non-existent file ${args.path}, this action take no effect, please continue your task`,
            };
        }
    }
}
