import {deleteFileParameters, DeleteFileParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunResult} from './utils';

export class DeleteFileToolImplement extends ToolImplementBase<DeleteFileParameter> {
    constructor(init: ToolImplementInit) {
        super('DeleteFileToolImplement', init, deleteFileParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            path: args.path,
        };
    }

    protected async execute(args: DeleteFileParameter): Promise<ToolRunResult> {
        const deleted = await this.editorHost.call('deleteWorkspaceFile', args.path);
        return {
            type: 'success',
            finished: false,
            output: deleted
                ? `File ${args.path} is deleted`
                : `You're deleting a non-existent file ${args.path}, this action take no effect, please continue your task`,
        };
    }
}
