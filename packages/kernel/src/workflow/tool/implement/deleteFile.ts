import {DeleteFileParameter} from '@oniichan/shared/tool';
import {DeleteFileToolCallMessageChunk, ParsedToolCallMessageChunk} from '@oniichan/shared/inbox';
import {ToolImplementBase, ToolExecuteResult} from './base';

function assertChunk(chunk: ParsedToolCallMessageChunk): asserts chunk is DeleteFileToolCallMessageChunk {
    if (chunk.toolName !== 'delete_file') {
        throw new Error('Invalid tool call message chunk');
    }
}

export class DeleteFileToolImplement extends ToolImplementBase<DeleteFileParameter> {
    async executeApprove(args: DeleteFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict();
        assertChunk(chunk);

        // It's a redundant check, but doesn't hit performance much
        const exists = await this.editorHost.call('checkFileExists', args.path);
        const fileEdit = await this.applyFileEdit(args.path, 'delete', '');
        chunk.executionData = fileEdit;

        if (fileEdit.type === 'error') {
            return {
                type: 'executeError',
                output: `Delete file ${args.path} failed for this reason: ${fileEdit.message}`,
            };
        }

        return {
            type: 'success',
            finished: false,
            output: exists
                ? `File ${args.path} is deleted.`
                : `You're deleting a non-existent file ${args.path}, this action take no effect, please continue your task.`,
        };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<DeleteFileParameter> {
        return {
            path: generated.path?.trim(),
        };
    }
}
