import {WriteFileParameter} from '@oniichan/shared/tool';
import {ParsedToolCallMessageChunk, WriteFileToolCallMessageChunk} from '@oniichan/shared/inbox';
import {ToolImplementBase, ToolExecuteResult} from './base';

function assertChunk(chunk: ParsedToolCallMessageChunk): asserts chunk is WriteFileToolCallMessageChunk {
    if (chunk.toolName !== 'write_file') {
        throw new Error('Invalid tool call message chunk');
    }
}

export class WriteFileToolImplement extends ToolImplementBase<WriteFileParameter> {
    async executeApprove(args: WriteFileParameter): Promise<ToolExecuteResult> {
        const chunk = this.getToolCallChunkStrict();
        assertChunk(chunk);

        const fileEdit = await this.applyFileEdit(args.path, 'write', args.content);
        chunk.executionData = fileEdit;

        return fileEdit.type === 'error'
            ? {
                type: 'executeError',
                output: `Write file ${args.path} failed for this reason: ${fileEdit.message}`,
            }
            : {
                type: 'success',
                finished: false,
                output:
                    `File is written to ${args.path}, you can trust the file content, it's not neccessary to read this file again`,
            };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<WriteFileParameter> {
        return {
            path: generated.path?.trim(),
            content: generated.content?.trim(),
        };
    }
}
